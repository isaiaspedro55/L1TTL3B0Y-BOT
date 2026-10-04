const{prepareWAMessageMedia,generateWAMessageFromContent}=require("@itsliaaa/baileys");

const APKPURE_BASE="https://apkpure.net";

function codificarLink(valor){return Buffer.from(valor,"utf8").toString("base64url");}
function decodificarLink(valor){return Buffer.from(valor,"base64url").toString("utf8");}

async function obterPagina(url){
  const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36","Accept-Language":"en-US,en;q=0.9,pt-BR;q=0.8"}});
  if(!res.ok)throw new Error(`APKPure HTTP ${res.status}`);
  return await res.text();
}

function limparHtml(texto){
  return texto
    .replace(/<[^>]*>/g," ")
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&#x27;/g,"'")
    .replace(/&nbsp;/g," ")
    .replace(/&#x2F;/g,"/")
    .replace(/\s+/g," ")
    .trim();
}

function tornarUrl(url){
  if(!url)return"";
  url=url.replace(/&amp;/g,"&");
  if(url.startsWith("//"))return"https:"+url;
  if(url.startsWith("/"))return APKPURE_BASE+url;
  return url;
}

async function pesquisarAPKPure(query){
  const busca=`${APKPURE_BASE}/search?q=${encodeURIComponent(query)}`;
  const html=await obterPagina(busca);

  const links=[...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)]
    .map(m=>tornarUrl(m[1]));

  const candidatos=[...new Set(
    links.filter(link=>/^https:\/\/apkpure\.net\/[^/]+\/[^/?#]+$/i.test(link))
  )];

  const termo=query.toLowerCase().trim();
  const slug=termo.replace(/\s+/g,"-");
  const palavras=termo.split(/\s+/).filter(Boolean);

  let pagina=candidatos.find(link=>{
    const l=link.toLowerCase();
    return l.includes(`/${slug}/`);
  });

  if(!pagina){
    pagina=candidatos.find(link=>{
      const l=link.toLowerCase();
      return l.includes(slug);
    });
  }

  if(!pagina){
    pagina=candidatos.find(link=>{
      const l=link.toLowerCase();
      return palavras.length&&palavras.every(p=>l.includes(p));
    });
  }

  if(!pagina)return null;

  const appHtml=await obterPagina(pagina);

  const titulo=limparHtml(
    appHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||""
  ).replace(/\s*[-|]\s*APKPure.*$/i,"").trim();

  const descricao=limparHtml(
    appHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]||""
  );

  const imagem=tornarUrl(
    appHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]||""
  );

  let versao="";

  const versionPatterns=[
    /Latest Version[\s\S]{0,500}?([0-9]+\.[0-9]+(?:\.[0-9]+){0,3})/i,
    /Version[\s\S]{0,300}?([0-9]+\.[0-9]+(?:\.[0-9]+){0,3})/i,
    /version[^>]*>\s*([^<\s][^<]*)/i
  ];

  for(const pattern of versionPatterns){
    const match=appHtml.match(pattern);
    if(match?.[1]){
      versao=limparHtml(match[1]);
      if(/[0-9]/.test(versao))break;
    }
  }

  let tamanho="";

  const sizePatterns=[
    /File Size[\s\S]{0,300}?([0-9]+(?:\.[0-9]+)?\s*(?:MB|GB|KB))/i,
    /([0-9]+(?:\.[0-9]+)?\s*(?:MB|GB|KB))[\s\S]{0,100}?File Size/i,
    /size[^>]*>\s*([^<]+)/i
  ];

  for(const pattern of sizePatterns){
    const match=appHtml.match(pattern);
    if(match?.[1]){
      tamanho=limparHtml(match[1]);
      if(/\d/.test(tamanho))break;
    }
  }

  const downloadPage=`${pagina.replace(/\/+$/,"")}/download`;

  return{
    title:titulo||query,
    description:descricao,
    thumbnail:imagem,
    version:versao||"Não informada",
    size:tamanho||"Não informado",
    url:pagina,
    downloadPage
  };
}

async function obterDownloadAPKPure(downloadPage){
  const html=await obterPagina(downloadPage);

  const links=[...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)]
    .map(m=>m[1].replace(/&amp;/g,"&").replace(/\\u0026/g,"&"));

  let download=links.find(link=>
    /^https?:\/\/d\.apkpure\.net\//i.test(link)||
    /^\/\/d\.apkpure\.net\//i.test(link)
  );

  if(!download){
    download=links.find(link=>
      /d\.apkpure\.net/i.test(link)&&
      /download/i.test(link)
    );
  }

  if(!download){
    const encontrados=html.match(
      /(?:https?:)?\/\/d\.apkpure\.net\/[^"'\\<>\s]+/gi
    )||[];

    download=encontrados[0]||"";
  }

  if(download.startsWith("//"))download="https:"+download;
  else if(download.startsWith("/"))download=APKPURE_BASE+download;

  return download;
}

async function enviarApp(sock,jid,msg,texto,seloBot,helpers={}){
  const{reagir,bLine,nomeBot=""}=helpers||{};

  try{
    texto=typeof texto==="string"
      ?texto
      :texto?.text||texto?.body||texto?.caption||"";

    texto=String(texto)
      .trim()
      .replace(/^[.!:\/]app(?:\s+|$)/i,"")
      .trim();

    if(!texto){
      await sock.sendMessage(
        jid,
        {text:bLine("📱","Digite o nome do aplicativo.\n\nExemplo: *:app WhatsApp*")},
        {quoted:seloBot}
      );
      return;
    }

    await reagir(sock,msg,"🔎");

    const app=await pesquisarAPKPure(texto);

    if(!app){
      await sock.sendMessage(
        jid,
        {text:bLine("❌",`Não encontrei *${texto}* no APKPure.`)},
        {quoted:seloBot}
      );

      await reagir(sock,msg,"❌");
      return;
    }

    const dadosBotao=codificarLink(JSON.stringify({
      url:app.url,
      downloadPage:app.downloadPage,
      title:app.title,
      version:app.version,
      size:app.size
    }));

    const textoCard=
`📱 *${app.title}*

📦 Versão: ${app.version}
💾 Tamanho: ${app.size}

🌐 APKPure`;

    const botoes=[
      {
        name:"quick_reply",
        buttonParamsJson:JSON.stringify({
          display_text:"📥 Baixar",
          id:`appbaixar_${dadosBotao}`
        })
      },
      {
        name:"quick_reply",
        buttonParamsJson:JSON.stringify({
          display_text:"🔗 Copiar link",
          id:`appcopiar_${dadosBotao}`
        })
      }
    ];

    let header={title:"📱 APKPure"};

    if(app.thumbnail){
      const media=await prepareWAMessageMedia(
        {image:{url:app.thumbnail}},
        {upload:sock.waUploadToServer}
      );

      header={
        title:"",
        hasMediaAttachment:true,
        imageMessage:media.imageMessage
      };
    }

    const conteudo={
      viewOnceMessage:{
        message:{
          interactiveMessage:{
            body:{text:textoCard},
            footer:{text:nomeBot||""},
            header,
            nativeFlowMessage:{
              buttons:botoes
            }
          }
        }
      }
    };

    const waMsg=generateWAMessageFromContent(
      jid,
      conteudo,
      {userJid:sock.user.id}
    );

    await sock.relayMessage(
      jid,
      waMsg.message,
      {messageId:waMsg.key.id}
    );

    await reagir(sock,msg,"✅");

  }catch(e){
    console.log("❌ app:",e.message);

    await sock.sendMessage(
      jid,
      {text:bLine("❌",`Erro ao pesquisar aplicativo.\n\n${e.message}`)},
      {quoted:seloBot}
    );

    await reagir(sock,msg,"❌");
  }
}

module.exports={
  enviarApp,
  pesquisarAPKPure,
  codificarLink,
  decodificarLink,
  obterDownloadAPKPure
};
