import { useState, useCallback } from "react";

class BeastCipher {
  constructor(chars = "嗷呜啊~") {
    this.chars = chars;
  }
  encode(txt) {
    txt = txt.trim();
    if (!txt) return "";
    const c = this.chars;
    let result = c[3] + c[1] + c[0];
    let offset = 0;
    for (let i = 0; i < txt.length; i++) {
      let code = txt.charCodeAt(i);
      for (let b = 12; b >= 0; b -= 4) {
        let hex = ((code >> b) + offset++) & 15;
        result += c[hex >> 2];
        result += c[hex & 3];
      }
    }
    result += c[2];
    return result;
  }
  decode(txt) {
    txt = txt.trim();
    if (txt.length < 4) return "";
    const c = this.chars;
    let result = "";
    let offset = 0;
    for (let i = 3; i < txt.length - 1; ) {
      let code = 0;
      for (let b = i + 8; i < b; i++) {
        const hi = c.indexOf(txt[i++]);
        const lo = c.indexOf(txt[i]);
        if (hi < 0 || lo < 0) return "⚠️ 解码失败：字符集不匹配";
        code = (code << 4) | (((hi << 2) | lo) + offset) & 0xf;
        offset = offset === 0 ? 0x10000 * 0x10000 - 1 : offset - 1;
      }
      result += String.fromCharCode(code);
    }
    return result;
  }
  isEncoded(txt) {
    txt = txt.trim();
    if (txt.length <= 11) return false;
    const c = this.chars;
    if (txt[0] !== c[3] || txt[1] !== c[1] || txt[2] !== c[0]) return false;
    if (txt[txt.length - 1] !== c[2]) return false;
    if ((txt.length - 4) % 8 !== 0) return false;
    return [...txt].every(ch => c.includes(ch));
  }
}

const PRESETS = [
  { name: "经典兽音", chars: "嗷呜啊~", emoji: "🐺", color: "#4A9EBF" },
  { name: "猫咪",     chars: "喵咪嗯~", emoji: "🐱", color: "#9B7EC8" },
  { name: "汪汪",     chars: "汪嗷呜噜", emoji: "🐶", color: "#C8893A" },
  { name: "萌熊",     chars: "哞哼吼嗯", emoji: "🐻", color: "#8B6B4A" },
  { name: "狐狸",     chars: "呀嗷嘿嗯", emoji: "🦊", color: "#C85A1A" },
  { name: "自定义",   chars: "",          emoji: "✏️", color: "#666"    },
];

export default function App() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [customChars, setCustomChars] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("encode");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("main");

  const preset = PRESETS[presetIdx];
  const chars = presetIdx === 5 ? customChars : preset.chars;
  const charValid = chars.length === 4 && new Set(chars).size === 4;
  const cipher = charValid ? new BeastCipher(chars) : null;
  const ac = preset.color;

  const run = useCallback(() => {
    setError("");
    if (!input.trim()) { setError("请输入内容"); return; }
    if (!cipher) { setError("请输入4个不重复的自定义字符"); return; }
    try {
      let result;
      if (mode === "encode") {
        result = cipher.encode(input);
      } else {
        if (!cipher.isEncoded(input)) {
          setError("⚠️ 字符集不匹配，请确认和加密时用的一样");
          return;
        }
        result = cipher.decode(input);
      }
      setOutput(result);
      setHistory(h => [{
        mode, chars, presetName: preset.name + preset.emoji,
        input: input.slice(0, 24) + (input.length > 24 ? "…" : ""),
        output: result.slice(0, 24) + (result.length > 24 ? "…" : ""),
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
      }, ...h.slice(0, 29)]);
    } catch (e) {
      setError("出错：" + e.message);
    }
  }, [input, mode, cipher, preset]);

  const copyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const swap = () => {
    if (!output) return;
    setInput(output);
    setOutput("");
    setMode(m => m === "encode" ? "decode" : "encode");
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#0e0e12", color:"#e8e4dc",
      fontFamily:"'Noto Sans SC','PingFang SC',system-ui,sans-serif",
      display:"flex", flexDirection:"column", alignItems:"center", paddingBottom:56,
    }}>
      {/* Header */}
      <div style={{ width:"100%", maxWidth:480, padding:"18px 18px 12px", borderBottom:"1px solid #1e1e24" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:32 }}>🐺</span>
          <div>
            <div style={{ fontSize:21, fontWeight:900, color:ac, letterSpacing:-0.5 }}>兽音译者</div>
            <div style={{ fontSize:10, color:"#555", letterSpacing:2 }}>BEAST CIPHER · 加密/解密 · 完全离线</div>
          </div>
          <div style={{ marginLeft:"auto", fontSize:9, padding:"3px 8px", border:"1px solid #1e3a1e", borderRadius:20, color:"#3a8a3a", letterSpacing:1 }}>● 无需网络</div>
        </div>
      </div>

      <div style={{ width:"100%", maxWidth:480, padding:"0 16px" }}>
        {/* Tabs */}
        <div style={{ display:"flex", marginTop:14, background:"#161618", borderRadius:10, padding:3 }}>
          {[["main","🔐 转换"],["history","📜 历史"],["about","ℹ️ 说明"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{
              flex:1, padding:"8px 0", border:"none", borderRadius:8,
              background:tab===key ? ac : "transparent",
              color:tab===key ? "#fff" : "#555",
              fontWeight:tab===key ? 700 : 400,
              fontSize:12, cursor:"pointer",
            }}>{label}</button>
          ))}
        </div>

        {tab==="main" && <>
          {/* Presets */}
          <div style={{ fontSize:9, color:"#444", letterSpacing:3, marginTop:16, marginBottom:6 }}>字符集（= 密钥，双方必须一致）</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {PRESETS.map((p,i)=>(
              <button key={i} onClick={()=>{ setPresetIdx(i); setOutput(""); setError(""); }} style={{
                padding:"5px 11px", borderRadius:16, fontSize:12,
                border:`1.5px solid ${presetIdx===i ? p.color : "#222"}`,
                background:presetIdx===i ? p.color+"22" : "transparent",
                color:presetIdx===i ? p.color : "#555",
                fontWeight:presetIdx===i ? 700 : 400, cursor:"pointer",
              }}>{p.emoji} {p.name}</button>
            ))}
          </div>
          {presetIdx===5 && (
            <input maxLength={4} value={customChars} onChange={e=>setCustomChars(e.target.value)}
              placeholder="输入任意4个不重复字符作为密钥"
              style={{ width:"100%", boxSizing:"border-box", marginTop:8, height:42,
                background:"#111", border:`1.5px solid ${charValid ? ac : "#5a2020"}`,
                borderRadius:10, padding:"0 14px", color:"#e8e4dc", fontSize:15,
                outline:"none", fontFamily:"inherit" }} />
          )}
          {charValid && (
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:8, padding:"8px 12px",
              background:"#13131a", borderRadius:8, border:`1px solid ${ac}33` }}>
              {[...chars].map((ch,i)=>(
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{ padding:"3px 10px", borderRadius:6, background:ac+"22",
                    border:`1px solid ${ac}44`, color:ac, fontSize:18, fontWeight:700 }}>{ch}</div>
                  <div style={{ fontSize:9, color:"#444", marginTop:2 }}>位{i}</div>
                </div>
              ))}
              <div style={{ marginLeft:"auto", fontSize:10, color:"#444", lineHeight:1.6 }}>每字→4组<br/>每组2字符</div>
            </div>
          )}

          {/* Mode */}
          <div style={{ display:"flex", marginTop:14, border:"1px solid #222", borderRadius:10, overflow:"hidden" }}>
            {[["encode","🔒 加密（人话→兽语）"],["decode","🔓 解密（兽语→人话）"]].map(([key,label])=>(
              <button key={key} onClick={()=>{ setMode(key); setOutput(""); setError(""); }} style={{
                flex:1, padding:"10px 4px", border:"none",
                background:mode===key ? ac : "#111",
                color:mode===key ? "#fff" : "#555",
                fontWeight:mode===key ? 700 : 400,
                fontSize:12, cursor:"pointer",
              }}>{label}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ fontSize:9, color:"#444", letterSpacing:3, marginTop:14, marginBottom:6 }}>
            {mode==="encode" ? "输入明文" : "粘贴兽语密文"}
          </div>
          <textarea value={input} onChange={e=>{ setInput(e.target.value); setError(""); }}
            placeholder={mode==="encode" ? "在这里输入你想加密的内容…" : "粘贴兽语密文…"}
            rows={4} style={{ width:"100%", boxSizing:"border-box", background:"#111",
              border:"1.5px solid #222", borderRadius:10, padding:"12px 14px",
              color:"#e8e4dc", fontSize:14, resize:"none", outline:"none",
              lineHeight:1.7, fontFamily:"inherit" }} />

          {error && <div style={{ marginTop:8, padding:"8px 12px", background:"#2a1010",
            border:"1px solid #5a2020", borderRadius:8, color:"#c88", fontSize:12 }}>{error}</div>}

          <button onClick={run} disabled={!input.trim()||!charValid} style={{
            width:"100%", marginTop:10, padding:"13px", border:"none", borderRadius:11,
            background:input.trim()&&charValid ? ac : "#1a1a1a",
            color:input.trim()&&charValid ? "#fff" : "#444",
            fontWeight:900, fontSize:15, cursor:input.trim()&&charValid?"pointer":"not-allowed",
            letterSpacing:1,
          }}>{mode==="encode" ? "🔒 加密成兽语" : "🔓 解密为人话"}</button>

          {output && (<>
            <div style={{ marginTop:12, background:"#111", border:`1.5px solid ${ac}44`,
              borderRadius:11, padding:"12px 14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:9, color:ac, letterSpacing:3 }}>
                  {mode==="encode" ? "兽语密文" : "解密明文"}</span>
                <button onClick={copyOutput} style={{ padding:"3px 10px", borderRadius:7,
                  border:"1px solid #333", background:copied?"#1a3a1a":"#1a1a1a",
                  color:copied?"#3a8":"#666", fontSize:11, cursor:"pointer" }}>
                  {copied ? "✓ 已复制" : "复制"}</button>
              </div>
              <div style={{ fontSize:14, lineHeight:1.8, wordBreak:"break-all", color:"#e8e4dc" }}>{output}</div>
              {mode==="encode" && (
                <div style={{ marginTop:6, fontSize:10, color:"#444" }}>
                  原文 {input.length} 字 → 密文 {output.length} 字</div>
              )}
            </div>
            <button onClick={swap} style={{ width:"100%", marginTop:8, padding:"8px",
              background:"transparent", border:`1px dashed ${ac}44`, borderRadius:9,
              color:ac+"88", fontSize:12, cursor:"pointer" }}>
              ⇅ 把结果放回输入框（继续操作）</button>
          </>)}
        </>}

        {tab==="history" && (
          <div style={{ marginTop:12 }}>
            {history.length===0
              ? <div style={{ textAlign:"center", padding:48, color:"#333" }}>
                  <div style={{fontSize:36}}>📭</div>
                  <div style={{marginTop:8,fontSize:13}}>还没有记录</div>
                </div>
              : history.map((h,i)=>(
                <div key={i} style={{ background:"#111", borderRadius:9, padding:"10px 12px",
                  marginBottom:8, borderLeft:`3px solid ${ac}66` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:ac }}>{h.presetName} · {h.mode==="encode"?"加密":"解密"}</span>
                    <span style={{ fontSize:10, color:"#444" }}>{h.time}</span>
                  </div>
                  <div style={{ fontSize:11, color:"#555" }}>字符集：{h.chars}</div>
                  <div style={{ fontSize:12, color:"#888", marginTop:3 }}>{h.mode==="encode"?"明":"密"}：{h.input}</div>
                  <div style={{ fontSize:12, color:"#ccc", marginTop:2 }}>{h.mode==="encode"?"密":"明"}：{h.output}</div>
                </div>
              ))
            }
          </div>
        )}

        {tab==="about" && (
          <div style={{ marginTop:16, fontSize:13, lineHeight:1.9, color:"#888" }}>
            <div style={{ fontSize:16, color:ac, fontWeight:700, marginBottom:10 }}>🔬 兽音加密原理</div>
            <p>兽音译者是一种<span style={{color:"#ccc"}}>基于 Unicode 的4字符编码加密算法</span>，含偏移量混淆，不可直接逆推。</p>
            <div style={{ background:"#111", borderRadius:10, padding:"12px 14px", margin:"12px 0",
              fontFamily:"monospace", fontSize:12, color:"#aaa", lineHeight:2 }}>
              <div style={{color:ac}}>// 加密步骤</div>
              <div>1. 取字符 Unicode（"你"= 0x4F60）</div>
              <div>2. 拆成4组4-bit</div>
              <div>3. 每组加递增偏移量后 &amp; 0xF</div>
              <div>4. 每4-bit用2个兽音字符表示</div>
              <div>5. 加头尾标记</div>
            </div>
            <p><span style={{color:"#ccc"}}>字符集 = 密钥。</span>你和朋友约定同一套4个字符，发出去的兽语只有你们能解读。</p>
            <p style={{fontSize:11, color:"#444"}}>纯本地运算，零网络请求，数据不离开设备。</p>
          </div>
        )}
      </div>
    </div>
  );
}
