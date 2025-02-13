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
      const response = await this.ec2.describeSecurityGroups({
        GroupIds: [this.config.securityGroupId]
      });

      const group = response.SecurityGroups?.[0];
      if (!group) {
        console.error('Security group not found:', this.config.securityGroupId);
        return false;
      }

      const ruleExists = group.IpPermissions?.some(permission =>
        permission.IpProtocol === 'tcp' &&
        permission.FromPort === this.config.port &&
        permission.ToPort === this.config.port &&
        permission.IpRanges?.some(range => 
          range.CidrIp === `${ip}/32` && 
          range.Description === this.config.description
        )
      );

      console.log('Security group rule verification:', {
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
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${this.maxRetries} to update security group rule`);

        // First verify if the rule already exists
        const ruleExists = await this.verifySecurityGroupRule(newIp);

        if (ruleExists) {
          console.log(`Rule already exists for IP ${newIp}, updating current IP`);
          this.currentIp = newIp;
          return;
        }

        // Remove old rule if it exists
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
            console.log(`Revoked access for old IP: ${this.currentIp}`);
          } catch (error: any) {
            if (error.Code !== 'InvalidPermission.NotFound') {
              console.error('Error revoking old rule:', error);
            }
          }
        }

        // Add new rule
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

        // Verify the rule was added successfully
        const verified = await this.verifySecurityGroupRule(newIp);
        if (!verified) {
          throw new Error('Failed to verify security group rule after adding');
        }

        console.log(`Successfully added and verified access for new IP: ${newIp}`);
        this.currentIp = newIp;
        return;

      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === this.maxRetries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
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