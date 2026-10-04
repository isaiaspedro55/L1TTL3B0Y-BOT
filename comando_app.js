const{prepareWAMessageMedia,generateWAMessageFromContent}=require("@itsliaaa/baileys");

const UPTODOWN_BASE="https://br.uptodown.com";

function codificarLink(valor){return Buffer.from(valor,"utf8").toString("base64url");}
function decodificarLink(valor){return Buffer.from(valor,"base64url").toString("utf8");}

async function obterPagina(url){
  const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36","Accept-Language":"pt-BR,pt;q=0.9"}});
  if(!res.ok)throw new Error(`Uptodown HTTP ${res.status}`);
  return await res.text();
}

function limparHtml(texto){
  return texto.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
}

async function pesquisarUptodown(query){
  const html=await obterPagina(`${UPTODOWN_BASE}/android/apps`);

  const termo=query.toLowerCase().trim();
  const links=[...html.matchAll(/href=["']([^"']+)["']/gi)].map(m=>m[1]);

  const candidatos=links.filter(link=>{
    if(!link.startsWith("https://")&&!link.startsWith("/"))return false;
    return link.includes("uptodown.com/android/");
  });

  let pagina=candidatos.find(link=>link.toLowerCase().includes(termo.replace(/\s+/g,"-")));
  
  if(!pagina){
    const palavras=termo.split(/\s+/).filter(Boolean);
    pagina=candidatos.find(link=>{
      const l=link.toLowerCase();
      return palavras.every(p=>l.includes(p));
    });
  }

  if(!pagina)return null;

  if(pagina.startsWith("/"))pagina=UPTODOWN_BASE+pagina;

  const appHtml=await obterPagina(pagina);

  const titulo=(appHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").replace(/\s*-\s*Uptodown.*$/i,"").trim();

  const descricao=limparHtml(appHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]||"");

  const imagem=appHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]||"";

  const versao=(appHtml.match(/(?:Versão|Version)[^<]{0,80}<\/[^>]+>\s*<[^>]+>([^<]+)/i)?.[1]||"").trim();

  const tamanho=(appHtml.match(/(?:Tamanho|Size)[^<]{0,80}<\/[^>]+>\s*<[^>]+>([^<]+)/i)?.[1]||"").trim();

  const downloadPath=pagina.replace(/\/android\/?$/i,"/android/download");

  return{
    title:titulo||query,
    description:descricao,
    thumbnail:imagem,
    version:versao||"Não informada",
    size:tamanho||"Não informado",
    url:pagina,
    downloadPage:downloadPath
  };
}

async function obterDownloadUptodown(downloadPage){
  const html=await obterPagina(downloadPage);

  const links=[...html.matchAll(/href=["']([^"']+)["']/gi)].map(m=>m[1]);

  let download=links.find(link=>/download|dw/i.test(link)&&/\.apk|\.xapk|download/i.test(link));

  if(!download){
    download=html.match(/https?:\/\/[^"'\\\s]+(?:\.apk|\.xapk)[^"'\\\s]*/i)?.[0]||"";
  }

  if(download.startsWith("//"))download="https:"+download;
  else if(download.startsWith("/"))download=UPTODOWN_BASE+download;

  return download;
}

async function enviarApp(sock,jid,msg,texto,seloBot,helpers={}){
  const{reagir,bLine,nomeBot=""}=helpers||{};

  try{
    texto=typeof texto==="string"?texto:texto?.text||texto?.body||texto?.caption||"";
    texto=String(texto).trim().replace(/^[.!:\/]app(?:\s+|$)/i,"").trim();

    if(!texto){
      await sock.sendMessage(jid,{text:bLine("📱","Digite o nome do aplicativo.\n\nExemplo: *:app WhatsApp*")},{quoted:seloBot});
      return;
    }

    await reagir(sock,msg,"🔎");

    const app=await pesquisarUptodown(texto);

    if(!app){
      await sock.sendMessage(jid,{text:bLine("❌",`Não encontrei *${texto}* na Uptodown.`)},{quoted:seloBot});
      await reagir(sock,msg,"❌");
      return;
    }

    const dadosBotao=codificarLink(JSON.stringify({
      url:app.url,
      downloadPage:app.downloadPage,
      title:app.title,
      version:app.version
    }));

    const textoCard=`📱 *${app.title}*\n\n📦 Versão: ${app.version}\n💾 Tamanho: ${app.size}\n\n🌐 Uptodown`;

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

    let header={title:"📱 Uptodown"};

    if(app.thumbnail){
      const media=await prepareWAMessageMedia({image:{url:app.thumbnail}},{upload:sock.waUploadToServer});
      header={title:"",hasMediaAttachment:true,imageMessage:media.imageMessage};
    }

    const conteudo={
      viewOnceMessage:{
        message:{
          interactiveMessage:{
            body:{text:textoCard},
            footer:{text:nomeBot||""},
            header,
            nativeFlowMessage:{buttons:botoes}
          }
        }
      }
    };

    const waMsg=generateWAMessageFromContent(jid,conteudo,{userJid:sock.user.id});
    await sock.relayMessage(jid,waMsg.message,{messageId:waMsg.key.id});

    await reagir(sock,msg,"✅");

  }catch(e){
    console.log("❌ app:",e.message);
    await sock.sendMessage(jid,{text:bLine("❌",`Erro ao pesquisar aplicativo.\n\n${e.message}`)},{quoted:seloBot});
    await reagir(sock,msg,"❌");
  }
}

module.exports={
  enviarApp,
  codificarLink,
  decodificarLink,
  obterDownloadUptodown
};
