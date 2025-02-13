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

  constructor(config: IpMonitorConfig) {
    this.config = config;
    this.ec2 = new EC2({
      region: process.env.AWS_REGION,
      credentials: defaultProvider()
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

  async updateSecurityGroupRule(newIp: string): Promise<void> {
    try {
      // First revoke existing rule if our current IP is known
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
        } catch (error) {
          // Ignore if the rule doesn't exist
          if ((error as any).Code !== 'InvalidPermission.NotFound') {
            throw error;
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

      this.currentIp = newIp;
      console.log(`Added access for new IP: ${newIp}`);
    } catch (error) {
      console.error('Error updating security group:', error);
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
