import mysql from 'mysql2/promise';
import { CustomTool } from '../../framework/core/CustomToolsManager';

export class DatabaseTool {
  private config: any;
  private connection: any;

  constructor(config: any) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.connection = await mysql.createConnection(this.config.connection);
  }

  async execute(params: any): Promise<any> {
    if (!this.connection) {
      await this.connect();
    }

    const { query, values } = params;
    
    try {
      const [rows] = await this.connection.execute(query, values);
      return {
        success: true,
        rows
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
    }
  }
}