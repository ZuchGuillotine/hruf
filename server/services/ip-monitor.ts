import { EC2 } from '@aws-sdk/client-ec2';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import fetch from 'node-fetch';

interface IpMonitorConfig {
  securityGroupId: string;
  description: string;
  port: number;
}

export class IpMonitorService {
  private currentIp: string | null = null;
  private ec2: EC2;
  private config: IpMonitorConfig;
  private updateInterval: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  constructor(config: IpMonitorConfig) {
    this.config = config;
    this.ec2 = new EC2({
      region: process.env.AWS_REGION,
      credentials: defaultProvider()
    });

    console.log('Initializing IP Monitor Service with config:', {
      securityGroupId: config.securityGroupId,
      port: config.port,
      description: config.description,
      timestamp: new Date().toISOString()
    });
  }

  async getCurrentPublicIp(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json() as { ip: string };
      return data.ip;
    } catch (error) {
      console.error('Error fetching public IP:', error);
      throw error;
    }
  }

  private async verifySecurityGroupRule(ip: string): Promise<boolean> {
    try {
      console.log(`Verifying security group rule for IP ${ip}`);

      const response = await this.ec2.describeSecurityGroups({
        GroupIds: [this.config.securityGroupId]
      });

      const group = response.SecurityGroups?.[0];
      if (!group) {
        console.error('Security group not found:', this.config.securityGroupId);
        return false;
      }

      // Log all current rules for debugging
      console.log('Current security group rules:', JSON.stringify(group.IpPermissions, null, 2));

      const ruleExists = group.IpPermissions?.some(permission =>
        permission.IpProtocol === 'tcp' &&
        permission.FromPort === this.config.port &&
        permission.ToPort === this.config.port &&
        permission.IpRanges?.some(range => 
          range.CidrIp === `${ip}/32`
        )
      );

      console.log('Security group rule verification result:', {
        ip,
        exists: ruleExists,
        groupId: this.config.securityGroupId,
        timestamp: new Date().toISOString()
      });

      return !!ruleExists;
    } catch (error) {
      console.error('Error verifying security group rule:', error);
      return false;
    }
  }

  async updateSecurityGroupRule(newIp: string): Promise<void> {
    console.log(`Updating security group rule for IP ${newIp}`);
    
    // Always attempt to clean up old rule first
    if (this.currentIp && this.currentIp !== newIp) {
      try {
        await this.ec2.revokeSecurityGroupIngress({
          GroupId: this.config.securityGroupId,
          IpPermissions: [{
            IpProtocol: 'tcp',
            FromPort: this.config.port,
            ToPort: this.config.port,
            IpRanges: [{
              CidrIp: `${this.currentIp}/32`,
              Description: this.config.description
            }]
          }]
        });
        console.log(`Removed old rule for IP: ${this.currentIp}`);
      } catch (error) {
        console.log(`Failed to remove old rule (this is normal if it didn't exist):`, error);
      }
    }
    
    this.currentIp = newIp;

    try {
      // Verify if the rule exists
      const exists = await this.verifySecurityGroupRule(newIp);

      if (exists) {
        console.log(`Rule already exists and verified for IP ${newIp}`);
        return;
      }

      // If we reach here, the rule doesn't exist despite the duplicate error
      // This could happen if the rule was deleted outside our service
      console.log('Rule reported as duplicate but not found, attempting cleanup...');

      // Try to remove any potential duplicate rules
      if (this.currentIp) {
        try {
          await this.ec2.revokeSecurityGroupIngress({
            GroupId: this.config.securityGroupId,
            IpPermissions: [{
              IpProtocol: 'tcp',
              FromPort: this.config.port,
              ToPort: this.config.port,
              IpRanges: [{
                CidrIp: `${this.currentIp}/32`,
                Description: this.config.description
              }]
            }]
          });
          console.log(`Successfully cleaned up old rule for IP: ${this.currentIp}`);
        } catch (error: any) {
          // Log but continue if cleanup fails
          console.log('Cleanup of old rule failed:', error.message);
        }
      }

      // Try to add the new rule
      try {
        await this.ec2.authorizeSecurityGroupIngress({
          GroupId: this.config.securityGroupId,
          IpPermissions: [{
            IpProtocol: 'tcp',
            FromPort: this.config.port,
            ToPort: this.config.port,
            IpRanges: [{
              CidrIp: `${newIp}/32`,
              Description: this.config.description
            }]
          }]
        });
        console.log(`Successfully added new rule for IP: ${newIp}`);
      } catch (error: any) {
        if (error.Code === 'InvalidPermission.Duplicate') {
          console.log(`Rule already exists for IP ${newIp} during final attempt`);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in updateSecurityGroupRule:', error);
      throw error;
    }
  }

  async checkAndUpdateIp(): Promise<void> {
    try {
      const newIp = await this.getCurrentPublicIp();

      if (newIp !== this.currentIp) {
        console.log('IP change detected:', {
          oldIp: this.currentIp,
          newIp,
          timestamp: new Date().toISOString()
        });

        await this.updateSecurityGroupRule(newIp);
      }
    } catch (error) {
      console.error('Error in IP check cycle:', error);
    }
  }

  start(intervalMinutes: number = 5): void {
    // Initial check
    this.checkAndUpdateIp();

    // Set up recurring checks
    this.updateInterval = setInterval(
      () => this.checkAndUpdateIp(),
      intervalMinutes * 60 * 1000
    );

    console.log(`IP monitor started with ${intervalMinutes} minute interval`);
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('IP monitor stopped');
    }
  }
}