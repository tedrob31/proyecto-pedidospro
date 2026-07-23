import { google } from 'googleapis';

let authClient: any = null;

export async function getGoogleSheetsClient() {
  if (authClient) return authClient;

  const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS_JSON;
  if (!credentialsJson) {
    throw new Error('GOOGLE_SHEETS_CREDENTIALS_JSON no está definido en .env.local');
  }

  try {
    const credentials = JSON.parse(credentialsJson);
    
    // Fix for .env parsing where \n might become literal '\\n'
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    authClient = google.sheets({ version: 'v4', auth: client as any });
    return authClient;
  } catch (error) {
    console.error('Error al inicializar Google Sheets API:', error);
    throw new Error('No se pudo inicializar la conexión con Google Sheets. Revisa el JSON de credenciales.');
  }
}

/**
 * Lee todas las filas de una hoja específica
 */
export async function readSheet(spreadsheetId: string, range: string) {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values || [];
}

/**
 * Escribe un valor en una celda específica
 */
export async function writeSheetCell(spreadsheetId: string, range: string, value: string) {
  const sheets = await getGoogleSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]]
    }
  });
}

/**
 * Añade una nueva fila al final de una hoja
 */
export async function appendSheetRow(spreadsheetId: string, range: string, values: string[]) {
  const sheets = await getGoogleSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [values]
    }
  });
}

/**
 * Actualiza una fila entera
 */
export async function updateSheetRow(spreadsheetId: string, range: string, values: string[]) {
  const sheets = await getGoogleSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values]
    }
  });
}

/**
 * Obtiene el sheetId numérico de una pestaña por su nombre
 */
export async function getSheetIdByName(spreadsheetId: string, sheetName: string): Promise<number | null> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });
  const sheet = response.data.sheets?.find((s: any) => s.properties?.title === sheetName);
  return sheet?.properties?.sheetId ?? null;
}

/**
 * Obtiene el sheetId de la primera pestaña (por defecto)
 */
export async function getFirstSheetId(spreadsheetId: string): Promise<number | null> {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });
  const sheet = response.data.sheets?.[0];
  return sheet?.properties?.sheetId ?? null;
}

/**
 * Elimina una fila físicamente
 * rowIndex es 0-indexed (0 = Fila 1)
 */
export async function deleteSheetRow(spreadsheetId: string, sheetId: number, rowIndex: number) {
  const sheets = await getGoogleSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,     // 0-indexed, inclusive
              endIndex: rowIndex + 1    // 0-indexed, exclusive
            }
          }
        }
      ]
    }
  });
}
