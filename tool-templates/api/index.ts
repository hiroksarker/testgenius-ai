import axios from 'axios';
import { CustomTool } from '../../framework/core/CustomToolsManager';

export class ApiTool {
  private config: any;
  private client: any;

  constructor(config: any) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: config.headers || {}
    });
  }

  async execute(params: any): Promise<any> {
    const { method = 'GET', endpoint, data } = params;
    
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data
      });
      
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}