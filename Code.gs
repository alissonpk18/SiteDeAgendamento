/**
 * API Agendamento - Salão La Belle Divas
 * Copie e cole este código em: Extensões > Apps Script
 */

const CONFIG = {
  MAX_AGENDAMENTOS_DIA: 10,
  PLANILHA_ID: "", // Deixe vazio para usar a planilha ativa
};

function doGet(e) {
  if (!e)
    return ContentService.createTextOutput(
      "Erro: O script deve ser executado como Web App, não manualmente."
    );
  const action = e.parameter ? e.parameter.action : null;

  if (action === "getAvailability") {
    return getAvailability(e.parameter.date);
  } else if (action === "adminData") {
    return getAdminData();
  } else if (action === "getMonthStatus") {
    return getMonthStatus(e.parameter.year, e.parameter.month);
  }

  return jsonResponse({ status: "error", message: "Ação inválida" });
}

function doPost(e) {
  if (!e)
    return ContentService.createTextOutput(
      "Erro: O script deve ser executado como Web App, não manualmente."
    );
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "book") {
      return bookAppointment(data);
    } else if (action === "blockDate") {
      // Legacy support
      return toggleBlockDate(data);
    } else if (action === "updateSettings") {
      return updateSettings(data);
    } else if (action === "saveDayConfig") {
      // New Handler
      return handleDayConfig(data);
    } else if (action === "updateAppointment") {
      return updateAppointment(data);
    } else if (action === "checkLogin") {
      return verifyLogin(data);
    }

    return jsonResponse({ status: "error", message: "Ação inválida" });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function verifyLogin(data) {
  const settings = getSettings();

  // Auto-initialize password if missing in Sheet
  if (!settings.hasOwnProperty("adminPassword")) {
    const sheet = getSheet("Config");
    sheet.appendRow(["adminPassword", "1234"]);
    settings.adminPassword = "1234"; // Update local variable
  }

  const correctPassword = settings.adminPassword;

  if (data.password === String(correctPassword)) {
    return jsonResponse({ status: "success" });
  } else {
    return jsonResponse({ status: "error", message: "Senha incorreta" });
  }
}

// --- Core Functions ---

function handleDayConfig(data) {
  const dateStr = data.date;
  const type = data.type; // 'normal', 'modified', 'blocked'

  const sheetBloqueios = getSheet("Bloqueios");
  const sheetEspeciais = getSheet("HorariosEspeciais");

  // 1. Limpeza Prévia (Remove definições anteriores para esta data em ambos)
  // Isso garante que um dia não seja bloqueado E especial ao mesmo tempo
  removeRowByDate(sheetBloqueios, dateStr);
  removeRowByDate(sheetEspeciais, dateStr);

  // 2. Aplicação da Nova Regra
  if (type === "normal") {
    return jsonResponse({
      status: "success",
      message: "Dia configurado como Normal.",
    });
  }

  if (type === "blocked") {
    sheetBloqueios.appendRow([dateStr, data.reason || "Bloqueio Manual"]);
    return jsonResponse({
      status: "success",
      message: "Dia Bloqueado com sucesso.",
    });
  }

  if (type === "modified") {
    sheetEspeciais.appendRow([
      dateStr,
      data.start,
      data.end,
      data.reason || "",
    ]);
    return jsonResponse({
      status: "success",
      message: "Horário modificado salvo.",
    });
  }

  return jsonResponse({
    status: "error",
    message: "Tipo de configuração desconhecido.",
  });
}

function removeRowByDate(sheet, dateStr) {
  const rows = sheet.getDataRange().getValues();
  // Loop de trás para frente para evitar problemas de index ao deletar
  for (let i = rows.length - 1; i >= 1; i--) {
    // Começa do último até o 1 (pula header)
    if (normalizeDate(rows[i][0]) == dateStr) {
      sheet.deleteRow(i + 1);
    }
  }
}

function getAvailability(dateStr) {
  const sheet = getSheet("Agendamentos");
  const bookedCount = countBookings(sheet, dateStr);
  const isBlocked = checkBlocked(dateStr);
  const settings = getSettings();

  // 1. Prioridade: Horário Especial (Data Específica)
  let workingHours = getSpecialSchedule(dateStr);

  // 2. Fallback: Horário Semanal (Weekly Schedule)
  // Se não houver override de data, usa a configuração semanal
  let weeklyBlocked = false;
  if (!workingHours && settings.weeklySchedule) {
    try {
      const schedule =
        typeof settings.weeklySchedule === "string"
          ? JSON.parse(settings.weeklySchedule)
          : settings.weeklySchedule;
      const daysMap = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

      // Identificar dia da semana da data solicitada
      const parts = dateStr.split("-");
      // Note: Date(y, m-1, d) constructor uses local time, but parts are YYYY-MM-DD.
      // To get correct day of week avoiding timezone issues, creating date at noon
      const d = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
        12,
        0,
        0
      );
      const dayId = daysMap[d.getDay()];

      const dayConfig = schedule[dayId];
      if (dayConfig) {
        if (!dayConfig.active) {
          weeklyBlocked = true;
        } else {
          // Se ativo, pega os horários
          workingHours = {
            start: normalizeTime(dayConfig.start),
            end: normalizeTime(dayConfig.end),
            reason: null, // Horário Normal
          };
        }
      }
    } catch (e) {
      console.error("Erro ao processar weeklySchedule", e);
    }
  }

  // Verifica Limite Diário
  const limit = settings.maxPerDay || CONFIG.MAX_AGENDAMENTOS_DIA;

  // Verifica Slots Ocupados (Horários)
  const busySlots = getBusySlots(sheet, dateStr);

  return jsonResponse({
    status: "success",
    date: dateStr,
    isBlocked: isBlocked || weeklyBlocked,
    blockedReason: isBlocked
      ? "Data bloqueada pelo administrador"
      : weeklyBlocked
      ? "Estabelecimento fechado neste dia"
      : null,
    isFull: bookedCount >= limit,
    busySlots: busySlots,
    remaining: limit - bookedCount,
    specialSchedule: workingHours, // Pode ser Especial ou Normal Semanal
  });
}

function getAdminData() {
  const settings = getSettings();
  const blockedDates = getBlockedDates();

  // Opcional: Pegar resumo de agendamentos de hoje
  const today = new Date().toISOString().split("T")[0];
  const sheet = getSheet("Agendamentos");
  const todayBookings = getDailyBookings(sheet, today);

  return jsonResponse({
    status: "success",
    settings: settings,
    blockedDates: blockedDates,
    todayCount: todayBookings.length,
    todayAppointments: todayBookings,
  });
}

function getSpecialSchedule(dateStr) {
  const sheet = getSheet("HorariosEspeciais");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    // Coluna A é Data
    // Comparação de string YYYY-MM-DD
    if (normalizeDate(data[i][0]) == dateStr) {
      return { start: data[i][1], end: data[i][2], reason: data[i][3] };
    }
  }
  return null;
}

function bookAppointment(data) {
  const sheet = getSheet("Agendamentos");
  const dateStr = data.date;
  const time = data.time;

  // 1. Verificação de Bloqueio Manual
  if (checkBlocked(dateStr)) {
    return jsonResponse({
      status: "error",
      message: "Data bloqueada pelo administrador.",
    });
  }

  // 1.5 Verificação de Bloqueio Semanal
  const settings = getSettings();
  if (settings.weeklySchedule) {
    try {
      const schedule =
        typeof settings.weeklySchedule === "string"
          ? JSON.parse(settings.weeklySchedule)
          : settings.weeklySchedule;
      const daysMap = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
      const parts = dateStr.split("-");
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayId = daysMap[d.getDay()];

      if (schedule[dayId] && !schedule[dayId].active) {
        return jsonResponse({
          status: "error",
          message: "Estabelecimento fechado neste dia da semana.",
        });
      }
    } catch (e) {}
  }

  // 2. Verificação de Limite Diário
  const limit = settings.maxPerDay || CONFIG.MAX_AGENDAMENTOS_DIA;

  if (countBookings(sheet, dateStr) >= limit) {
    return jsonResponse({
      status: "error",
      message: "Limite de agendamentos para o dia atingido.",
    });
  }

  // Salvar
  sheet.appendRow([
    new Date(), // Timestamp
    data.name,
    data.service,
    dateStr,
    time,
    "Pendente via WhatsApp",
  ]);

  return jsonResponse({ status: "success", message: "Agendamento realizado!" });
}

function toggleBlockDate(data) {
  // Legacy Wrapper calling new function
  if (data.type === "block") {
    return handleDayConfig({
      date: data.date,
      type: "blocked",
      reason: "Bloqueio Rápido (Legacy)",
    });
  } else {
    return handleDayConfig({ date: data.date, type: "normal" });
  }
}

function updateSettings(data) {
  const sheet = getSheet("Config");
  const rows = sheet.getDataRange().getValues();

  // Helper to find row index by key
  const findRow = (key) => {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) return i + 1;
    }
    return -1;
  };

  // We want to save 'limit' as 'maxPerDay' and 'weeklySchedule' as 'weeklySchedule'
  const updates = {};
  if (data.limit) updates["maxPerDay"] = data.limit;
  if (data.weeklySchedule) updates["weeklySchedule"] = data.weeklySchedule;
  if (data.adminName) updates["adminName"] = data.adminName;
  if (data.adminPassword) updates["adminPassword"] = data.adminPassword;

  // Apply updates
  for (const [key, value] of Object.entries(updates)) {
    const rowIndex = findRow(key);
    if (rowIndex > 0) {
      // Update
      sheet.getRange(rowIndex, 2).setValue(value);
    } else {
      // Create
      sheet.appendRow([key, value]);
      // Update local cache of rows for next iteration if needed (or just append)
      // For simplicity in this script, append works fine as we won't have duplicate keys in one requests usually
    }
  }

  return jsonResponse({ status: "success", message: "Configurações salvas!" });
}

function getSettings() {
  const sheet = getSheet("Config");
  const data = sheet.getDataRange().getValues();
  let settings = { maxPerDay: CONFIG.MAX_AGENDAMENTOS_DIA };

  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    const val = data[i][1];

    if (key === "maxPerDay") settings.maxPerDay = parseInt(val);
    else settings[key] = val; // Load other settings dynamically (like weeklySchedule, adminName, adminPassword)
  }
  return settings;
}

// --- Helpers ---

function normalizeDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(val).trim();
}

function normalizeTime(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "HH:mm");
  }
  return String(val).trim();
}

function getSheet(name) {
  const ss = CONFIG.PLANILHA_ID
    ? SpreadsheetApp.openById(CONFIG.PLANILHA_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Headers Iniciais
    if (name === "Agendamentos")
      sheet.appendRow([
        "DataHora",
        "Cliente",
        "Serviço",
        "DataAgendada",
        "Turno",
        "Status",
      ]);
    if (name === "Bloqueios") sheet.appendRow(["DataBloqueada", "Motivo"]);
    if (name === "HorariosEspeciais")
      sheet.appendRow(["Data", "Inicio", "Fim", "Motivo"]);
    if (name === "Config") sheet.appendRow(["Chave", "Valor"]);
  }
  return sheet;
}

function countBookings(sheet, dateStr) {
  const data = sheet.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    // Coluna D (Index 3) é a DataAgendada
    if (normalizeDate(data[i][3]) == dateStr && data[i][5] !== "Cancelado") {
      count++;
    }
  }
  return count;
}

function getDailyBookings(sheet, dateStr) {
  const data = sheet.getDataRange().getValues();
  let bookings = [];
  for (let i = 1; i < data.length; i++) {
    // Coluna D (Index 3) é a DataAgendada
    if (normalizeDate(data[i][3]) == dateStr) {
      // Removido filtro de 'Cancelado' para permitir admin ver tudo se quiser, ou podemos manter.
      // Se user quer mudar status, devia ver cancelados também? Vamos assumir que sim para poder "Reagendar" ou confirmar.
      // Mas o countBookings filtra. Vamos manter consistencia ou melhorar.
      // Vou manter o filtro 'Cancelado' OFF aqui para admin ver tudo? Não, segue o padrão visual.
      // Se o user quer MUDAR status, ele deve poder ver os que estão "Pendente".
      // Vamos manter o filtro de cancelado? O original tinha.
      // Se eu tiro o !== Cancelado, aparecem os cancelados também. Isso é bom pro admin.
      bookings.push({
        id: data[i][0], // Coluna A: Timestamp (ID único)
        time: normalizeTime(data[i][4]), // Coluna E: Turno/Horário
        client: data[i][1], // Coluna B: Cliente
        service: data[i][2], // Coluna C: Serviço
        status: data[i][5], // Coluna F: Status
        phone: "",
      });
    }
  }
  // Ordenar por horário
  bookings.sort((a, b) => {
    if (a.time < b.time) return -1;
    if (a.time > b.time) return 1;
    return 0;
  });
  return bookings;
}

function updateAppointment(data) {
  const sheet = getSheet("Agendamentos");
  const rows = sheet.getDataRange().getValues();
  const idToFind = data.id; // Expecting timestamp string

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    // Comparação de ID (Timestamp)
    const rowDate = new Date(rows[i][0]).toISOString();
    const targetDate = new Date(idToFind).toISOString();

    if (rowDate === targetDate) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > 0) {
    if (data.status) sheet.getRange(rowIndex, 6).setValue(data.status); // Col F
    if (data.client) sheet.getRange(rowIndex, 2).setValue(data.client); // Col B
    if (data.service) sheet.getRange(rowIndex, 3).setValue(data.service); // Col C

    return jsonResponse({
      status: "success",
      message: "Agendamento atualizado.",
    });
  } else {
    return jsonResponse({
      status: "error",
      message: "Agendamento não encontrado.",
    });
  }
}

function getBusySlots(sheet, dateStr) {
  const data = sheet.getDataRange().getValues();
  let slots = [];
  for (let i = 1; i < data.length; i++) {
    if (normalizeDate(data[i][3]) == dateStr && data[i][5] !== "Cancelado") {
      slots.push(data[i][4]); // Coluna E (Turno/Horário)
    }
  }
  return slots;
}

function checkBlocked(dateStr) {
  const sheet = getSheet("Bloqueios");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizeDate(data[i][0]) == dateStr) return true;
  }
  return false;
}

function getBlockedDates() {
  const sheet = getSheet("Bloqueios");
  const data = sheet.getDataRange().getValues();
  let dates = [];
  for (let i = 1; i < data.length; i++) {
    const d = normalizeDate(data[i][0]);
    if (d) dates.push(d); // Formato YYYY-MM-DD
  }
  return dates;
}

function getSpecialSchedule(dateStr) {
  const sheet = getSheet("HorariosEspeciais");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizeDate(data[i][0]) == dateStr) {
      // Format Times properly
      const start = normalizeTime(data[i][1]);
      const end = normalizeTime(data[i][2]);
      return { start: start, end: end, reason: data[i][3] };
    }
  }
  return null;
}

function removeRowByDate(sheet, dateStr) {
  const rows = sheet.getDataRange().getValues();
  // Loop de trás para frente para evitar problemas de index ao deletar
  for (let i = rows.length - 1; i >= 1; i--) {
    // Começa do último até o 1 (pula header)
    if (normalizeDate(rows[i][0]) == dateStr) {
      sheet.deleteRow(i + 1);
    }
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function limparPendentesAntigos() {
  const sheet = getSheet("Agendamentos");
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  const LIMIT_MS = 24 * 60 * 60 * 1000; // 24 horas

  // De trás para frente para deletar sem quebrar índices
  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const timestamp = new Date(data[i][0]);
    const status = data[i][5];

    if (status === "Pendente via WhatsApp") {
      if (now - timestamp > LIMIT_MS) {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
  }
  return jsonResponse({
    status: "success",
    message: `Limpeza concluída. ${deletedCount} agendamentos removidos.`,
  });
}

function getMonthStatus(year, month) {
  // Retorna datas bloqueadas ou lotadas para o mês
  const blockedDates = [];
  const settings = getSettings();
  const limit = settings.maxPerDay || CONFIG.MAX_AGENDAMENTOS_DIA;

  // Cache Counts
  const sheet = getSheet("Agendamentos");
  const data = sheet.getDataRange().getValues();
  const counts = {};

  for (let i = 1; i < data.length; i++) {
    const d = normalizeDate(data[i][3]);
    if (d && data[i][5] !== "Cancelado") {
      counts[d] = (counts[d] || 0) + 1;
    }
  }

  // Cache Manual Blocks
  const blockSheet = getSheet("Bloqueios");
  const blockData = blockSheet.getDataRange().getValues();
  const manualBlocks = new Set();
  for (let i = 1; i < blockData.length; i++) {
    manualBlocks.add(normalizeDate(blockData[i][0]));
  }

  // Weekly Schedule
  let weeklySchedule = null;
  try {
    if (settings.weeklySchedule) {
      weeklySchedule =
        typeof settings.weeklySchedule === "string"
          ? JSON.parse(settings.weeklySchedule)
          : settings.weeklySchedule;
    }
  } catch (e) {}

  const daysMap = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const daysInMonth = new Date(year, month, 0).getDate(); // month é 1-based aqui? O construtor é monthIndex (0-11). Se user passar 1-12...
  // Usuário deve passar 1=Jan. Date(2025, 1, 0) = Last day of Jan.

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d, 12, 0, 0); // avoid timezone
    const dateStr = Utilities.formatDate(
      dateObj,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );

    let isBlocked = false;

    // 1. Manual Block
    if (manualBlocks.has(dateStr)) isBlocked = true;

    // 2. Full
    if (!isBlocked && (counts[dateStr] || 0) >= limit) isBlocked = true;

    // 3. Weekly
    if (!isBlocked && weeklySchedule) {
      const dayId = daysMap[dateObj.getDay()];
      // Check if there is a Special Schedule forcing open?
      // Simplificação: Se weekly fecha, checar se tem special.
      // Para performance, ignorar special schedule "open" override nesta view mensal rápida,
      // ou carregar special schedules. Vamos assumir weekly rule principal.
      if (weeklySchedule[dayId] && !weeklySchedule[dayId].active) {
        // Check override
        const special = getSpecialSchedule(dateStr); // Expensive inside loop?
        if (!special) isBlocked = true;
      }
    }

    if (isBlocked) blockedDates.push(dateStr);
  }

  return jsonResponse({ status: "success", disabledDates: blockedDates });
}

function setup() {
  getSheet("Agendamentos");
  getSheet("Bloqueios");
  getSheet("HorariosEspeciais");
  getSheet("Config");
}
