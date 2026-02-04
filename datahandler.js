const fs = require('fs');
const path = require('path');

function minutosDecimais(duracao) {
  let [min, seg] = duracao.split(':').map(Number);
  return min + seg / 60;
}

// ------------------ ARQUIVOS JSON ------------------
const arquivoMatchs = path.join(__dirname, 'matchs.json');
const arquivoPlayersScrim = path.join(__dirname, 'playersScrim.json');
const arquivoPlayersCamp = path.join(__dirname, 'playersCamp.json');
const arquivoTeams = path.join(__dirname, 'teams.json');

// ------------------ FUNÇÕES DE LEITURA E ESCRITA ------------------
function lerJSON(file) {
    if (!fs.existsSync(file)) return [];
    const dados = fs.readFileSync(file, 'utf-8');
    return JSON.parse(dados);
}

function salvarJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ------------------ FUNÇÕES DE MATCHS ------------------
function lerMatchs() { return lerJSON(arquivoMatchs); }
function salvarMatchs(matchs) { salvarJSON(arquivoMatchs, matchs); }

// ------------------ FUNÇÕES DE PLAYERS ------------------
function lerPlayersScrim() { return lerJSON(arquivoPlayersScrim); }
function salvarPlayersScrim(players) { salvarJSON(arquivoPlayersScrim, players); }

function lerPlayersCamp() { return lerJSON(arquivoPlayersCamp); }
function salvarPlayersCamp(players) { salvarJSON(arquivoPlayersCamp, players); }

// ------------------ FUNÇÕES DE TIMES ------------------
function lerTeams() { return lerJSON(arquivoTeams); }
function salvarTeams(teams) { salvarJSON(arquivoTeams, teams); }


// ------------------ ATUALIZAR ESTATÍSTICAS DOS PLAYERS ------------------
function atualizarPlayersMatch(matchs) {
    // Carrega ambos os arquivos de players
    let playersScrim = lerPlayersScrim();
    let playersCamp = lerPlayersCamp();

    matchs.forEach(match => {
        let players = match.tipo === "scrim" ? playersScrim : playersCamp;

        match.jogos.forEach(jogo => {
            let totalDanoCausadoTime = jogo.jogadores_aliados.reduce((acc, p) => acc + p.dano_causado, 0);
            let totalDanoRecebidoTime = jogo.jogadores_aliados.reduce((acc, p) => acc + p.dano_recebido, 0);

            jogo.jogadores_aliados.forEach(jogadorData => {
                let player = players.find(p => p.player_id === jogadorData.player_id);
                if (!player) return;

                // Atualiza totais
                player.totalKills += jogadorData.kills;
                player.totalDeaths += jogadorData.deaths;
                player.totalAssists += jogadorData.assists;
                player.totalParticipacoes += jogadorData.kills + jogadorData.assists;
                player.totalOuro += jogadorData.ouro_total;
                let minutos = minutosDecimais(jogo.duracao_minutos);
                player.totalMinutos += minutos;
                player.totalDano += jogadorData.dano_causado;
                player.totalDanoRecebido += jogadorData.dano_recebido;

                // Porcentagens
                let pctPart = (jogadorData.kills + jogadorData.assists) / jogo.kills_aliadas * 100;
                player.totalPctParticipacoes += pctPart;

                let pctDanoCausado = jogadorData.dano_causado / totalDanoCausadoTime * 100;
                let pctDanoRecebido = jogadorData.dano_recebido / totalDanoRecebidoTime * 100;
                player.totalPctDanoCausado += pctDanoCausado;
                player.totalPctDanoRecebido += pctDanoRecebido;

                // Partidas jogadas
                player.partidasJogadas += 1;

                // Recalcula médias
                player.mediaKills = player.totalKills / player.partidasJogadas;
                player.mediaDeaths = player.totalDeaths / player.partidasJogadas;
                player.mediaAssists = player.totalAssists / player.partidasJogadas;
                player.ouroPorMinuto = player.totalOuro / player.totalMinutos;
                player.mediaPctParticipacao = player.totalPctParticipacoes / player.partidasJogadas;
                player.mediaDanoCausado = player.totalDano / player.partidasJogadas;
                player.mediaDanoRecebido = player.totalDanoRecebido / player.partidasJogadas;
                player.mediaPctDanoCausado = player.totalPctDanoCausado / player.partidasJogadas;
                player.mediaPctDanoRecebido = player.totalPctDanoRecebido / player.partidasJogadas;
            });
        });

        // Salva no arquivo correto
        if (match.tipo === "scrim") salvarPlayersScrim(players);
        else salvarPlayersCamp(players);
    });
}

module.exports = {
  lerMatchs,
  salvarMatchs,
  lerPlayersScrim,
  salvarPlayersScrim,
  lerPlayersCamp,
  salvarPlayersCamp,
  lerTeams,
  salvarTeams,
  atualizarPlayersMatch
};

