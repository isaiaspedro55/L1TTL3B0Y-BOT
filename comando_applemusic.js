const{prepareWAMessageMedia,generateWAMessageFromContent}=require("@itsliaaa/baileys");

function codificarLink(valor){return Buffer.from(valor,"utf8").toString("base64url");}
function decodificarLink(valor){return Buffer.from(valor,"base64url").toString("utf8");}

async function pesquisarAppleMusic(query){
  const url=`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&country=ao&limit=5`;
  const res=await fetch(url);
  if(!res.ok)throw new Error(`Apple Search HTTP ${res.status}`);
  const json=await res.json();
  if(!json.results?.length)return null;

  const r=json.results[0];

  return{
    title:r.trackName||query,
    artist:r.artistName||"Desconhecido",
    album:r.collectionName||"Apple Music",
    url:r.trackViewUrl||r.collectionViewUrl||"",
    thumbnail:(r.artworkUrl600||r.artworkUrl100||"").replace(/100x100bb/,"600x600bb"),
    duration:r.trackTimeMillis?`${Math.floor(r.trackTimeMillis/60000)}:${String(Math.floor((r.trackTimeMillis%60000)/1000)).padStart(2,"0")}`:"--:--",
    previewUrl:r.previewUrl||"",
    trackId:r.trackId
  };
}

async function enviarAppleMusic(sock,jid,msg,texto,seloBot,helpers={}){
  const{reagir,bLine,nomeBot=""}=helpers||{};

  try{
    texto=typeof texto==="string"?texto:texto?.text||texto?.body||texto?.caption||"";
    texto=String(texto).trim();
    texto=texto.replace(/^[.!:\/]applemusic(?:\s+|$)/i,"").trim();

    if(!texto){
      await sock.sendMessage(jid,{text:bLine("🍎","Digite o nome da música.\n\nExemplo: *:applemusic Calema Te Amo*")},{quoted:seloBot});
      return;
    }

    await reagir(sock,msg,"🔎");

    const musica=await pesquisarAppleMusic(texto);

    if(!musica){
      await sock.sendMessage(jid,{text:bLine("❌",`Não encontrei *${texto}* no Apple Music.`)},{quoted:seloBot});
      await reagir(sock,msg,"❌");
      return;
    }

    const dados=codificarLink(JSON.stringify({
      url:musica.url,
      title:musica.title,
      artist:musica.artist,
      previewUrl:musica.previewUrl,
      trackId:musica.trackId
    }));

    const textoCard=`🍎 *${musica.title}*\n\n👤 Artista: ${musica.artist}\n💿 Álbum: ${musica.album}\n⏱️ Duração: ${musica.duration}\n\n🎵 Apple Music`;

    const botoes=[
      {
        name:"quick_reply",
        buttonParamsJson:JSON.stringify({
          display_text:"📥 Baixar",
          id:`applebaixar_${dados}`
        })
      },
      {
        name:"quick_reply",
        buttonParamsJson:JSON.stringify({
          display_text:"🔗 Copiar link",
          id:`applecopiar_${dados}`
        })
      }
    ];

    let header={title:"🍎 Apple Music"};

    if(musica.thumbnail){
      const media=await prepareWAMessageMedia(
        {image:{url:musica.thumbnail}},
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
            nativeFlowMessage:{buttons:botoes}
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
    console.log("❌ Apple Music:",e.message);

    await sock.sendMessage(
      jid,
      {text:bLine("❌",`Erro ao pesquisar no Apple Music.\n\n${e.message}`)},
      {quoted:seloBot}
    );

    await reagir(sock,msg,"❌");
  }
}

module.exports={
  enviarAppleMusic,
  pesquisarAppleMusic,
  codificarLink,
  decodificarLink
};
