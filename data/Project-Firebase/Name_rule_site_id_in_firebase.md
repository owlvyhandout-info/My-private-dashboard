https://chat.z.ai/c/4095e66f-311c-46b9-86ab-597405d7bada
สาเหตุ: Site ID ห้ามใช้ \_ (underscore) ❌
---

Firebase Hosting site ID อนุญาตเฉพาะ:



ตัวอักษรภาษาอังกฤษ พิมพ์เล็ก (a–z)

ตัวเลข (0–9)

ขีดกลาง - (ไม่ขึ้นต้นด้วยเลข ไม่ลงท้ายด้วย -)

ชื่อ owlvy-infoquiz\_with\_sim\_lab\_physics\_gravity\_force มี \_ อยู่ 5 ตัว ระบบจึงปฏิเสธทันที ทั้งใน Console และ CLI



วิธีแก้: เปลี่ยน \_ เป็น -

ใช้ชื่อ: owlvy-infoquiz-with-sim-lab-physics-gravity-force



1\. สร้าง site ใหม่

bash



firebase hosting:sites:create owlvy-infoquiz-with-sim-lab-physics-gravity-force

หรือทำผ่าน Firebase Console → Hosting → เมนู ⋮ → Add another site



2\. แก้ firebase.json

ชื่อโฟลเดอร์ public ใช้ \_ ได้ตามเดิม (เป็นแค่ path ในเครื่อง) แก้แค่ site ID:



json



{

&#x20; "target": "owlvy-infoquiz-with-sim-lab-physics-gravity-force",

&#x20; "public": "owlvy-infoquiz\_with\_sim\_lab\_physics\_gravity\_force",

&#x20; "ignore": \[

&#x20;   "firebase.json",

&#x20;   "\*\*/.\*",

&#x20;   "\*\*/node\_modules/\*\*"

&#x20; ]

}

3\. ลงทะเบียน target ใน .firebaserc

เนื่องจากคุณใช้ "target" (ไม่ใช่ "site") ต้องเพิ่มใน .firebaserc ด้วย ไม่งั้น deploy จะ error ว่าหา target ไม่เจอ:



json



{

&#x20; "projects": {

&#x20;   "default": "YOUR\_PROJECT\_ID"

&#x20; },

&#x20; "targets": {

&#x20;   "YOUR\_PROJECT\_ID": {

&#x20;     "hosting": {

&#x20;       "owlvy-infoquiz-with-sim-lab-physics-gravity-force": \["owlvy-infoquiz-with-sim-lab-physics-gravity-force"]

&#x20;     }

&#x20;   }

&#x20; }

}

หรือใช้คำสั่ง:



bash



firebase target:apply hosting owlvy-infoquiz-with-sim-lab-physics-gravity-force owlvy-infoquiz-with-sim-lab-physics-gravity-force

ทางเลือกง่ายกว่า: ถ้าไม่อยากยุ่งกับ .firebaserc ให้ใช้ key "site" แทน "target" (แบบ entry แรกของคุณที่เป็น owlvy-carefulness-contest) แบบนี้ไม่ต้องลงทะเบียนอะไรเลย:



json



{ "site": "owlvy-infoquiz-with-sim-lab-physics-gravity-force", ... }

4\. สร้างโฟลเดอร์และ deploy

bash



mkdir owlvy-infoquiz\_with\_sim\_lab\_physics\_gravity\_force

\# วาง index.html ข้างใน



firebase deploy --only hosting:owlvy-infoquiz-with-sim-lab-physics-gravity-force

เช็คเพิ่มเติม

Site ID ต้องไม่ซ้ำกับโปรเจกต์อื่นทั้งระบบ เพราะจะกลายเป็นโดเมน SITE\_ID.web.app — ถ้าชื่อถูกใช้ไปแล้วจะ error ว่า "already taken" (แต่กรณีของคุณน่าจะติดที่ \_ ก่อน)

ผสม "site" กับ "target" ในไฟล์เดียวกันได้ ไม่มีปัญหา

ตรวจว่าเชื่อมโปรเจกต์ถูกตัวก่อน deploy: firebase use

