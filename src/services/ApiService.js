import {JsonRpc} from 'eosjs';


class ApiService {

  static async getTable(scope, tableName, key) {
    try{
//      const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
      const rpc = new JsonRpc('https://kylin.eosargentina.io', { fetch });
      const result = await rpc.get_table_rows({
        "json": true,
        "code": 'evolutiondex',
        "scope": scope,
        "table": tableName,
        "limit": 1,
      });
      if (key === 'connector1') {
        return result.rows[0].connector1;
      }
      if (key === 'connector2') {
        return result.rows[0].connector2;
      }
      if (key === 'supply') {
        return result.rows[0].supply;
      }
      if (key === 'fee') return result.rows[0].fee;
    } catch (err) {
      console.error(err);
    }
  }
}

export default ApiService;
