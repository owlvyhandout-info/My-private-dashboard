/**
 * Owlvy Infographic Engine v6.2 (Refactored & CORS Fixed)
 * สำหรับ อาว์ลวี่ เฮาส์ (Owlvy House)
 * 📌 Deploy เป็น Web App → Execute as: Me → Who has access: Anyone
 */
//https://chat.qwen.ai/c/232363db-e1b4-4ff1-8ad4-1768cf81a89e-ยังไม่ล่าสุดให้ทำใหม่ถ้าจะใช้
const CONFIG = {
  GEMINI_API_KEY: "ใส่_API_KEY_GEMINI_ตรงนี้",
  GROQ_API_KEY:   "ใส่_API_KEY_GROQ_ตรงนี้",
  SPREADSHEET_ID: "ใส่_ID_ของ_GOOGLE_SHEET_ตรงนี้",
  SHEET_NAME:     "Rules", // ⚠️ ต้องตรงชื่อแท็บเป๊ะ
  GEMINI_MODELS:  ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"],
  GROQ_MODEL:     "llama-3.3-70b-versatile"
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Empty request" });
    }
    
    // 🔑 รองรับการส่งแบบ text/plain (ที่ Frontend ใช้เพื่อเลี่ยง CORS)
    const rawData = e.postData.contents.trim();
    const data = JSON.parse(rawData);
    const action = data.action;

    if (action === "get_rules") {
      return getRulesFromSheet();
    }

    const langMode = data.language || "Prompt_EN_Content_TH";
    let languageRule = (langMode === "Prompt_EN_Content_TH") ? 
      `ENG Instructions | THAI Content & Labels (แสดงผลภาษาไทยถูกต้อง 100% ห้ามเพี้ยน) + English terms in brackets.` :
      `Strictly in ${langMode === "Full_Thai" ? "THAI" : "ENGLISH"} only.`;

    const finalPrompt = `Role: Expert Sci-Vis Director at อาว์ลวี่ เฮาส์.
[Task]: Structured Infographic Prompt
Subject: ${data.subject || "N/A"} | Level: ${data.level || "N/A"} | Style: ${data.style || "N/A"}
Pages: ${data.pages || "Auto"}
[Academic & Visual Cautions]:
${data.cautions || "None"}
[Source Content]:
${data.content || "N/A"}
[Language Rule]:
${languageRule}
[REQUIRED OUTPUT STRUCTURE]:
You MUST format your response strictly using the structure below to allow easy editing:
==================================================
🎯 GLOBAL MASTER PROMPT
Art Style & Aesthetic: Define the visual style
Color Palette & Lighting: Global colors and mood
==================================================
==================================================
📄 PAGE-BY-PAGE BREAKDOWN
--- PAGE 1: [Title] ---
Visual Component: Specific visual description
Text Content & Labels: Exact text to be placed
Layout & Composition: Flow and placement
(Repeat for other pages)
`;

    const result = callAIWithFallback(finalPrompt);
    return jsonResponse({ status: "success", aiResponse: result });

  } catch (err) {
    console.error("doPost Error:", err);
    return jsonResponse({ status: "error", message: "Server Error: " + err.message });
  }
}

function getRulesFromSheet() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found. Please check CONFIG.SHEET_NAME.`);

    const rows = sheet.getDataRange().getValues();
    let rulesMap = {};
    for (let i = 1; i < rows.length; i++) {
      const key = String(rows[i][0] || "").trim();
      const val = String(rows[i][1] || "").trim();
      if (key && val) rulesMap[key] = val;
    }
    return jsonResponse({ status: "success", rules: rulesMap });
  } catch (err) {
    console.error("getRulesFromSheet Error:", err);
    return jsonResponse({ status: "error", message: err.message });
  }
}

function callAIWithFallback(prompt) {
  for (let model of CONFIG.GEMINI_MODELS) {
    try { return callGemini(model, prompt); }
    catch (e) { console.warn(`Failed with ${model}, trying next...`); }
  }
  return callGroq(CONFIG.GROQ_MODEL, prompt);
}

function callGemini(model, text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ contents: [{ parts: [{ text: text }] }] }),
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(res.getContentText());
  if (res.getResponseCode() === 200 && json.candidates?.[0]?.content?.parts?.[0]?.text) {
    return json.candidates[0].content.parts[0].text;
  }
  throw new Error(`Gemini API Error: ${res.getResponseCode()} - ${JSON.stringify(json.error || {})}`);
}

function callGroq(model, text) {
  if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY.startsWith("ใส่_")) {
    throw new Error("Groq API Key is missing or placeholder.");
  }
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const options = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${CONFIG.GROQ_API_KEY}` },
    payload: JSON.stringify({ model: model, messages: [{ role: "user", content: text }], max_tokens: 2048 }),
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(res.getContentText());
  if (res.getResponseCode() === 200 && json.choices?.[0]?.message?.content) {
    return json.choices[0].message.content;
  }
  throw new Error(`Groq API Error: ${res.getResponseCode()}`);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonResponse({ status: "success", message: "Owlvy Engine v6.2 is Active." });
}
