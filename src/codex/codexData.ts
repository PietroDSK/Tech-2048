import { ModuleKey } from "../achievements/achievements";

export type CodexEntry = {
  id: string;
  title: string;
  body: string[];
  module?: ModuleKey;
};

export const CODEX: CodexEntry[] = [
  {
    id: "powers_of_two",
    title: "Potências de 2 no 2048",
    body: [
      "O 2048 é literalmente uma jornada pelas potências de 2: 2, 4, 8, 16...",
      "Entender que dobrar valor = 1 merge ajuda a planejar: foque em alimentar um canto.",
    ]
  },
  {
    id: "binary_intro",
    title: "Binário em 30 segundos",
    body: [
      "Em binário, cada casa vale uma potência de 2. 10110₂ = 16 + 4 + 2 = 22.",
      "A lógica do 2048 conversa com esse crescimento exponencial.",
    ]
  },
  {
    id: "cpu_basics",
    title: "CPU: Cérebro do Sistema",
    body: [
      "A CPU executa instruções, coordena fluxo e controla a lógica do jogo.",
      "No painel, aumentar a CPU simboliza decisões e combos consistentes.",
    ],
    module: "CPU"
  },
  {
    id: "gpu_shaders",
    title: "GPU e Shaders",
    body: [
      "Shaders aplicam efeitos visuais na GPU (blur, glow, distorções).",
      "Otimize: efeitos sutis que reforçam feedback sem distrair.",
    ],
    module: "GPU"
  },
  {
    id: "io_buses",
    title: "I/O e Barramentos",
    body: [
      "I/O conecta componentes: entradas do jogador, dados salvos, anúncios.",
      "No painel, I/O representa combos num único movimento (alto throughput).",
    ],
    module: "IO"
  },
  {
    id: "net_latency",
    title: "Rede e Latência",
    body: [
      "Enviar score, pegar ranking: cada requisição tem latência.",
      "Exibir loaders curtos e feedbacks claros ajuda a UX.",
    ],
    module: "NET"
  },
];
