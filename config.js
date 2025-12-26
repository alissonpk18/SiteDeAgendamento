// =================================================================
// ⚙️ ARQUIVO DE CONFIGURAÇÃO GERAL
// =================================================================
// Altere apenas este arquivo para usar o sistema em outro negócio.

const Config = {
    // -------------------------------------------------------------
    // 1. PROJECT IDENTITY
    // -------------------------------------------------------------
    // Nome do Negócio (Para aparecer nas mensagens, títulos e alertas)
    BUSINESS_NAME: "Salão La Belle Divas",

    // -------------------------------------------------------------
    // 2. INTEGRAÇÃO (Backend)
    // -------------------------------------------------------------
    // Cole aqui a URL do seu Google Web App (Backend)
    API_URL: "https://script.google.com/macros/s/AKfycbziPiOSiGiLaZjCrTtVY7017hJfaPeHtNO_88vsYbPlX3CzLJNJY51-9f4ZH9cTnffEWQ/exec", 

    // -------------------------------------------------------------
    // 3. CONTACT INFO
    // -------------------------------------------------------------
    // Número do WhatsApp que receberá as mensagens (formato internacional sem +)
    // Exemplo: 5571999999999
    WHATSAPP_NUMBER: "5571992518952",
    
    // -------------------------------------------------------------
    // 4. AGENDAMENTO & SERVIÇOS
    // -------------------------------------------------------------
    // Limite padrão de atendimentos por dia
    DEFAULT_DAILY_LIMIT: 10,

    // Duração de cada horário (em minutos) - Para geração automática
    SLOT_DURATION: 60, // 1 hora
    
    // (A lista manual TIME_SLOTS foi removida em favor da geração automática)

    // Serviços disponíveis (Copiados do HTML para cá)
    SERVICES: [
        "Cabelo (Corte/Penteado/Coloração)",
        "Unhas (Manicure/Pedicure/Alongamento)",
        "Sobrancelhas e Make",
        "Spa dos Pés",
        "Combo Completo (Cabelo + Unhas)"
    ]
};

// Exportar para uso global
window.Config = Config;
