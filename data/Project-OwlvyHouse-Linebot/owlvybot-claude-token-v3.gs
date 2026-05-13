var channelToken = "X3XXXXXXXXXXXXXXXXXXXXX/2QTKRwdB04t89/1O/w1cDnyilFU="; // LINE Channel Access Token
var apiKey = "gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";       // GROQ API Key (gsk_xxx)

var DAILY_LIMIT = 20;

// ==========================
// 1. REPLY ไป LINE
// ==========================
function replyMsg(replyToken, mess) {
  var url = "https://api.line.me/v2/bot/message/reply";
  var opt = {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Authorization": "Bearer " + channelToken
    },
    method: "post",
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: mess
    }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(url, opt);
}

// ==========================
// 2. LINE WEBHOOK
// ==========================
function doPost(e) {
  var value = JSON.parse(e.postData.contents);
  var events = value.events;

  if (!events || events.length === 0) return;

  var event = events[0];
  var type = event.type;
  var replyToken = event.replyToken;
  var userId = event.source.userId;

  switch (type) {

    case "follow":
      replyMsg(replyToken, [{
        type: "text",
        text: "สวัสดีครับ! 👋\n" +
              "ผมคือ 'ครูวิทย์' ผู้ช่วยสอนวิทยาศาสตร์ 🔬\n\n" +
              "ถามได้เลยครับ เช่น\n\n" +
              "🧬 ชีววิทยา/เคมี:\n" +
              "- เซลล์พืชกับเซลล์สัตว์ต่างกันอย่างไร\n" +
              "- ปฏิกิริยาเคมีคืออะไร\n\n" +
              "⚡ ฟิสิกส์:\n" +
              "- เครื่องบินบินได้อย่างไร\n" +
              "- แสงสะท้อนและหักเหต่างกันอย่างไร\n\n" +
              "🌏 โลกและธรณีวิทยา:\n" +
              "- แผ่นดินไหวเกิดจากอะไร\n" +
              "- วัฏจักรน้ำคืออะไร\n\n" +
              "🌌 ดาราศาสตร์:\n" +
              "- ดาวเคราะห์เกิดขึ้นได้อย่างไร\n" +
              "- ทำไมดวงจันทร์มีหลายรูปร่าง\n\n" +
              "📌 จำกัด " + DAILY_LIMIT + " คำถาม/วัน/คน"
      }]);
      break;

    case "message":
      if (event.message.type === "text") {
        var text = event.message.text.trim();

        if (!checkLimit(userId)) {
          replyMsg(replyToken, [{
            type: "text",
            text: "⚠️ วันนี้คุณถามครบ " + DAILY_LIMIT + " คำถามแล้วครับ\n" +
                  "กลับมาถามใหม่ได้พรุ่งนี้นะครับ 😊"
          }]);
          return;
        }
if (text === "myid") {
  replyMsg(replyToken, [{
    type: "text",
    text: "LINE ID ของคุณคือ:\n" + userId
  }]);
  return;
}
        addCount(userId);
        callGroq(replyToken, text);

      } else {
        replyMsg(replyToken, [{
          type: "text",
          text: "ขออภัยครับ รองรับเฉพาะข้อความตัวอักษรครับ 🙏"
        }]);
      }
      break;

    default:
      break;
  }
}

// ==========================
// 3. เช็คและนับจำนวนคำถาม
// ==========================
function checkLimit(userId) {
  var cache = CacheService.getScriptCache();
  var key = "count_" + userId + "_" + getToday();
  var count = cache.get(key);
  return !count || parseInt(count) < DAILY_LIMIT;
}

function addCount(userId) {
  var cache = CacheService.getScriptCache();
  var key = "count_" + userId + "_" + getToday();
  var count = cache.get(key);
  var newCount = count ? parseInt(count) + 1 : 1;
  cache.put(key, newCount.toString(), 86400);
}

function getToday() {
  return Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd");
}

// ==========================
// 4. GROQ (TEACHER MODE)
// ==========================
function callGroq(replyToken, userMessage) {

  var systemPrompt =
    "คุณคือ 'ครูวิทย์' ครูผู้ช่วยสอนวิทยาศาสตร์สำหรับนักเรียนไทย\n\n" +

    "เมื่อได้รับคำถาม ให้ทำตามขั้นตอนนี้เสมอ:\n\n" +

    "ขั้นที่ 1 — ระบุหลักวิทยาศาสตร์ที่เกี่ยวข้อง\n" +
    "วิเคราะห์ว่าเหตุการณ์หรือปรากฏการณ์ในคำถามนั้น\n" +
    "เกี่ยวข้องกับความรู้วิทยาศาสตร์เรื่องใดบ้าง\n" +
    "เรียงลำดับจากตรงประเด็นที่สุด ไปหาเรื่องที่เสริมความเข้าใจ\n" +
    "โดยแบ่งตามหมวดหมู่ดังนี้ (ระบุเฉพาะที่เกี่ยวข้องจริงๆ):\n" +
    "- ชีววิทยาและเคมี\n" +
    "- ฟิสิกส์พื้นฐาน\n" +
    "- โลกและธรณีวิทยา\n" +
    "- ดาราศาสตร์\n\n" +

    "ขั้นที่ 2 — อธิบายตามระดับความลึก\n" +
    "เน้นระดับมัธยมต้นเป็นหลัก ใช้ภาษาเข้าใจง่าย\n" +
    "ถ้าจำเป็นต้องอธิบายระดับมัธยมปลาย ให้บอกก่อนว่า\n" +
    "'ในระดับที่ลึกขึ้น...' แล้วค่อยอธิบาย\n" +
    "ยกตัวอย่างจากชีวิตจริงที่เด็กไทยเข้าใจได้\n\n" +

    "รูปแบบคำตอบ:\n" +
    "🔬 หลักวิทยาศาสตร์ที่เกี่ยวข้อง\n" +
    "(ระบุชื่อเรื่อง เรียงจากตรงประเด็นที่สุด)\n\n" +
    "🔹 สรุป (1-2 บรรทัด)\n\n" +
    "📘 อธิบาย\n" +
    "(เริ่มจากหลักที่ตรงที่สุด แล้วเสริมเรื่องอื่น\n" +
    "ถ้าต้องลึกระดับมัธยมปลาย ให้บอกก่อนว่า ในระดับที่ลึกขึ้น...)\n\n" +
    "💡 ตัวอย่างที่เห็นภาพ\n" +
    "(จากชีวิตจริงที่เด็กไทยคุ้นเคย)\n\n" +
    "⚠️ ข้อควรระวัง\n" +
    "(จุดที่มักเข้าใจผิด ใส่เฉพาะถ้ามีจริงๆ)\n\n" +
    "📝 ตัวอย่างคำถามที่ออกสอบบ่อย\n" +
    "(ยกตัวอย่าง 3 คำถาม พร้อมคำตอบสั้นๆ\n" +
    "สร้างเองได้แต่ต้องถูกต้องตามหลักวิทยาศาสตร์)\n\n" +
    "📚 แหล่งอ้างอิง\n" +
    "(ระบุชื่อแหล่งที่น่าเชื่อถือ เช่น สสวท. Wikipedia)\n\n" +

    "ข้อห้าม:\n" +
    "- ห้ามใช้ตาราง\n" +
    "- ห้ามใช้ Markdown เช่น **bold** ## หรือ ---\n" +
    "- ห้ามแต่ง URL ที่ไม่มีจริง\n" +
    "- ถ้าถามนอกเรื่องวิทยาศาสตร์ให้ปฏิเสธสุภาพ\n" +
    "- ห้ามตอบยาวเกินไป ให้กระชับได้ใจความ";

  var payload = {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 1500
  };

  var res = UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (res.getResponseCode() !== 200) {
    console.error("Groq error: " + res.getContentText());
    replyMsg(replyToken, [{
      type: "text",
      text: "ขออภัยครับ ระบบขัดข้องชั่วคราว\nกรุณาลองใหม่อีกครั้งนะครับ 🙏"
    }]);
    return;
  }

  var responseData = JSON.parse(res.getContentText());
  var textResult = responseData.choices[0].message.content;

  var truncated = textResult.length > 4999
    ? textResult.substring(0, 4996) + "..."
    : textResult;

  replyMsg(replyToken, [{ type: "text", text: truncated }]);
}

// ==========================
// 5. TEST FUNCTIONS
// ==========================
function testKeys() {
  console.log("channelToken : " + (channelToken ? "✅ มีค่าแล้ว" : "❌ ยังว่างอยู่"));
  console.log("apiKey       : " + (apiKey       ? "✅ มีค่าแล้ว" : "❌ ยังว่างอยู่"));
}

function testGroq() {
  var res = UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "เครื่องบินบินได้อย่างไร" }]
    }),
    muteHttpExceptions: true
  });
  console.log("Status: " + res.getResponseCode());
  console.log("Reply: " + JSON.parse(res.getContentText()).choices[0].message.content);
}

function testLimit() {
  var fakeId = "U_test_001";
  console.log("ก่อนถาม: " + (checkLimit(fakeId) ? "✅ ยังถามได้" : "❌ เกินลิมิต"));
  for (var i = 0; i < DAILY_LIMIT; i++) addCount(fakeId);
  console.log("หลังถามครบ " + DAILY_LIMIT + " ครั้ง: " + (checkLimit(fakeId) ? "✅ ยังถามได้" : "❌ เกินลิมิต"));
}

function testWebhook() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        events: [{
          type: "message",
          replyToken: "test-reply-token",
          message: { type: "text", text: "เครื่องบินบินได้อย่างไร" },
          source: { userId: "U_test_001" }
        }]
      })
    }
  };
  doPost(fakeEvent);
  console.log("✅ testWebhook เสร็จแล้ว");
}
