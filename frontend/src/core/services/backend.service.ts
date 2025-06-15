import {Injectable} from "@angular/core";

export enum DatabaseResponse {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  REPLACED = 'REPLACED',
  ERROR = 'ERROR',
  DELETED = 'DELETED',
}

@Injectable()
export class BackendService {

  constructor() {

  }

  private readonly serverUrl: string = '/api/';

  websocket(url: string): WebSocket {
    /**
     * Establish a duplex connection with the server
     * @param url - Websocket query for server
     * @returns WebSocket - Active WebSocket connection with the server
     * */

    return new WebSocket(this.serverUrl.replace('http', 'ws') + this.parseURL(url));
  }

  async get(url: string): Promise<any> {
    /**
     * GET is used to retrieve data from the database
     * @param url - Query for server
     * @returns {} - JSONObject from database
     * */

    const response = await fetch(this.serverUrl + this.parseURL(url), {
      method: 'GET',
      credentials: 'include'
    });
    return await response.json();
  }

  async post(url: string, body: any): Promise<any> {
    /**
     * POST sends data to the server or creates a new resource in the database
     * @param url - Query for server
     * @param body - Sent as JSON data
     * @returns {} - JSONObject response from server
     * */

    const response = await fetch(this.serverUrl + this.parseURL(url), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body || {})
    });
    return await response.json();
  }

  async put(url: string, body: any): Promise<any> {
    /**
     * PUT is used to update all fields in an existing resource in the database
     * @param url - Query for server
     * @param body - Sent as JSON data
     * @returns {} - JSONObject response from server
     * */

    const response = await fetch(this.serverUrl + this.parseURL(url), {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body || {})
    });
    return await response.json();
  }

  async patch(url: string, body: any): Promise<any> {
    /**
     * PATCH is used to update specific changes to an existing resource in the database
     * @param url - Query for server
     * @param body - Sent as JSON data
     * @returns {} - JSONObject response from server
     * */

    const response = await fetch(this.serverUrl + this.parseURL(url), {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body || {})
    });
    return await response.json();
  }

  async delete(url: string, unid: string): Promise<any> {
    /**
     * DELETE is used to delete a resource in the database
     * @param url - Document path without UNID
     * @param unid - Document UNID to be deleted
     * @returns {} - JSONObject response from server
     * */

    const response = await fetch(this.serverUrl + this.parseURL(url), {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        unid: unid
      })
    });
    return await response.json();
  }

  private parseURL(url: string): string {
    if (url.startsWith('/')) {
      url = url.substring(1);
    }

    return url;
  }
}
