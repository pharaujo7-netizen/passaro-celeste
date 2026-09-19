"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bell,
  Bird,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Clock3,
  Home,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MessageSquareText,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  TentTree,
  Upload,
  UserCog,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type Section =
  | "inicio"
  | "unidades"
  | "classes"
  | "especialidades"
  | "agenda"
  | "diretoria"
  | "atividades"
  | "adm";
type Role =
  | "Criador"
  | "Desbravador"
  | "Responsável"
  | "Instrutor"
  | "Secretaria"
  | "Direção";
const nav = [
  ["inicio", "Início", Home],
  ["unidades", "Unidades", UsersRound],
  ["classes", "Classes", BookOpen],
  ["especialidades", "Especialidades", Award],
  ["agenda", "Agenda", CalendarDays],
  ["diretoria", "Diretoria", ShieldCheck],
  ["atividades", "Minhas atividades", ClipboardCheck],
  ["adm", "Adm", LayoutDashboard],
] as const;
const units = [
  {
    name: "Arara Azul",
    info: "Meninas • 10 a 12 anos",
    color: "from-cyan-500 to-blue-700",
    counselors: "Conselheiras: a definir",
    members: ["Ana", "Beatriz", "Clara", "Luiza", "Marina", "Sofia"],
  },
  {
    name: "Harpia",
    info: "Meninas • 13 a 15 anos",
    color: "from-fuchsia-500 to-violet-800",
    counselors: "Conselheiras: a definir",
    members: ["Yasmin", "Alice", "Helena", "Isabela", "Laura"],
  },
  {
    name: "Gavião",
    info: "Meninos • 10 a 12 anos",
    color: "from-amber-400 to-orange-700",
    counselors: "Conselheiros: a definir",
    members: ["Davi", "Gabriel", "João", "Luigi", "Pedro"],
  },
  {
    name: "Falcão",
    info: "Meninos • 13 a 15 anos",
    color: "from-red-500 to-red-900",
    counselors: "Conselheiros: a definir",
    members: ["Arthur", "Enzo", "Lucas", "Matheus", "Rafael"],
  },
];
const classes = [
  ["Amigo", "10 anos", "bg-sky-600", 74],
  ["Companheiro", "11 anos", "bg-red-600", 61],
  ["Pesquisador", "12 anos", "bg-emerald-600", 46],
  ["Pioneiro", "13 anos", "bg-slate-700", 68],
  ["Excursionista", "14 anos", "bg-violet-600", 39],
  ["Guia", "15 anos", "bg-amber-500", 82],
] as const;
const groups = [
  ["Artes e habilidades manuais", 58, "Origami, desenho, fotografia"],
  ["Atividades agrícolas", 26, "Horticultura, apicultura, jardinagem"],
  [
    "Atividades missionárias e comunitárias",
    43,
    "Evangelismo, Bíblia, serviço comunitário",
  ],
  [
    "Atividades profissionais",
    46,
    "Informática, jornalismo, primeiros socorros",
  ],
  ["Atividades recreativas", 92, "Acampamento, ciclismo, nós e amarras"],
  ["Ciência e saúde", 55, "Astronomia, química, saúde e cura"],
  ["Estudo da natureza", 87, "Aves, répteis, árvores, ecologia"],
  ["Habilidades domésticas", 31, "Culinária, costura, orçamento familiar"],
  ["ADRA", 18, "Resposta a desastres, fome, refugiados"],
] as const;
const board = [
  ["Diretor", "Tiago Furioto", "11 99661-0902"],
  ["Diretor Associado", "Hanan Ortiz", "11 95240-4468"],
  ["Diretora Associada", "Mayra Cutipa", "11 98296-3850"],
  ["Secretaria", "Letícia Conde", "11 96153-8537"],
  ["Capelã", "Vanusa Furioto", "+55 11 94388-2530"],
] as const;
const agenda = [
  [
    "20",
    "SET",
    "Reunião regular do clube",
    "Dom 09:00–12:00",
    "IASD Jardim Brasil",
  ],
  ["27", "SET", "Acampamento de unidade", "Dom 08:00–15:00", "Sítio Ebenézer"],
  ["05", "OUT", "Feira de especialidades", "Seg 09:00–16:00", "Ginásio local"],
  ["12", "OUT", "Cerimônia de admissão", "Seg 10:30", "IASD Jardim Brasil"],
] as const;
const acts = [
  {
    title: "Montar e desmontar uma barraca",
    type: "Classe Pioneiro",
    status: "Correção necessária",
    note: "Envie uma foto mostrando também a fixação dos espeques.",
    progress: 70,
  },
  {
    title: "Identificar 10 aves da região",
    type: "Especialidade de Aves",
    status: "Em análise",
    note: "Enviado ontem • Instrutora: Vanusa",
    progress: 84,
  },
  {
    title: "Participar de uma caminhada de 8 km",
    type: "Classe Pioneiro",
    status: "Concluído",
    note: "Aprovado por Hanan Ortiz",
    progress: 100,
  },
];
const classSections = [
  "Gerais",
  "Descoberta espiritual",
  "Servindo a outros",
  "Desenvolvendo amizade",
  "Saúde e aptidão física",
  "Organização e liderança",
  "Estudo da natureza",
  "Arte de acampar",
  "Enriquecendo seu estilo de vida",
];
const classRequirements: Record<string, string[]> = {
  Gerais: [
    "Participar regularmente das reuniões da classe e do clube.",
    "Conhecer e explicar o Voto e a Lei do Desbravador.",
    "Registrar as atividades concluídas no cartão.",
  ],
  "Descoberta espiritual": [
    "Realizar as leituras bíblicas indicadas para a classe.",
    "Memorizar e explicar os textos propostos.",
    "Participar de uma atividade devocional ou estudo bíblico.",
  ],
  "Servindo a outros": [
    "Participar de uma ação de serviço à comunidade.",
    "Demonstrar uma forma prática de ajudar alguém.",
    "Apresentar um breve relato da atividade realizada.",
  ],
  "Desenvolvendo amizade": [
    "Participar de uma atividade sobre amizade e respeito.",
    "Demonstrar cooperação dentro da unidade.",
    "Conversar com o instrutor sobre relacionamentos saudáveis.",
  ],
  "Saúde e aptidão física": [
    "Cumprir a atividade física prevista para a classe.",
    "Conhecer princípios de alimentação, higiene e descanso.",
    "Acompanhar uma meta pessoal de saúde.",
  ],
  "Organização e liderança": [
    "Participar de uma atividade de organização da unidade.",
    "Conhecer funções básicas do clube.",
    "Colaborar no planejamento de uma reunião ou evento.",
  ],
  "Estudo da natureza": [
    "Observar e identificar elementos da natureza.",
    "Registrar a observação por texto, desenho ou fotografia.",
    "Relacionar o cuidado com a natureza à criação de Deus.",
  ],
  "Arte de acampar": [
    "Demonstrar habilidades de acampamento compatíveis com a classe.",
    "Praticar segurança e técnicas campestres orientadas.",
    "Enviar fotos ou relato da atividade prática.",
  ],
  "Enriquecendo seu estilo de vida": [
    "Concluir uma especialidade indicada para a classe.",
    "Aplicar a habilidade aprendida em uma situação prática.",
    "Apresentar a evidência final ao instrutor.",
  ],
};
const specialtyLists: Record<string, string[]> = {
  "Artes e habilidades manuais": [
    "Arte em barbante",
    "Arte em massa de pão",
    "Cestaria",
    "Cerâmica",
    "Crochê",
    "Decoração de bolos",
    "Desenho e pintura",
    "Escultura",
    "Fotografia",
    "Lettering",
    "Modelagem",
    "Origami",
    "Pintura em tecido",
    "Sabonetes artesanais",
    "Trabalhos em madeira",
  ],
  "Atividades agrícolas": [
    "Agricultura",
    "Apicultura",
    "Avicultura",
    "Criação de animais",
    "Cultivo de frutas pequenas",
    "Floricultura",
    "Horticultura",
    "Jardinagem",
    "Pecuária",
    "Pomicultura",
  ],
  "Atividades missionárias e comunitárias": [
    "Aventuras com Cristo",
    "Cidadania cristã",
    "Colportagem",
    "Evangelismo pessoal",
    "História denominacional",
    "Liderança juvenil",
    "Marcação bíblica",
    "Mordomia",
    "Pregação",
    "Serviço comunitário",
    "Temperança",
    "Testemunho juvenil",
  ],
  "Atividades profissionais": [
    "Administração",
    "Computação",
    "Contabilidade",
    "Eletricidade",
    "Empreendedorismo",
    "Encanamento",
    "Jornalismo",
    "Manutenção de bicicletas",
    "Mecânica automotiva",
    "Primeiros socorros – básico",
    "Rádio",
    "Secretariado",
    "Soldagem",
    "Vídeo",
  ],
  "Atividades recreativas": [
    "Acampamento I",
    "Acampamento II",
    "Acampamento III",
    "Acampamento IV",
    "Arte de acampar",
    "Caminhada",
    "Ciclismo",
    "Cozinha ao ar livre",
    "Excursionismo pedestre",
    "Fogueiras e cozinha ao ar livre",
    "Mapa e bússola",
    "Nós e amarras",
    "Ordem unida",
    "Orientação",
    "Pioneirias",
    "Segurança em acampamentos",
  ],
  "Ciência e saúde": [
    "Astronomia",
    "Bioquímica",
    "Coração e circulação",
    "Digestão",
    "Física",
    "Higiene oral",
    "Microscopia",
    "Nutrição",
    "Óptica",
    "Primeiros socorros",
    "Química",
    "Reanimação cardiopulmonar",
    "Saúde e cura",
    "Sistema nervoso",
  ],
  "Estudo da natureza": [
    "Anfíbios",
    "Animais domésticos",
    "Aranhas",
    "Árvores",
    "Aves",
    "Cães",
    "Climatologia",
    "Ecologia",
    "Flores",
    "Fungos",
    "Insetos",
    "Mamíferos",
    "Plantas silvestres comestíveis",
    "Répteis",
    "Rochas e minerais",
    "Sementes",
    "Vida marinha",
  ],
  "Habilidades domésticas": [
    "Arte culinária",
    "Congelamento de alimentos",
    "Conservação de alimentos",
    "Costura básica",
    "Cuidados da casa",
    "Lavanderia",
    "Nutrição doméstica",
    "Orçamento familiar",
    "Panificação",
    "Planejamento de refeições",
  ],
  ADRA: [
    "Alfabetização",
    "Avaliação da comunidade",
    "Desenvolvimento comunitário",
    "Fome no mundo",
    "Mediação e pacificação",
    "Resposta a desastres",
    "Refugiados e deslocados",
    "Serviço comunitário",
    "Serviço voluntário",
    "Segurança hídrica",
  ],
};

function Heading({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 sm:text-base">{desc}</p>
      </div>
      {action}
    </div>
  );
}
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card className="border border-blue-100 bg-gradient-to-br from-white to-blue-50 shadow-sm">
      <CardContent className="p-4">
        <p className="text-2xl font-bold text-blue-800">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </CardContent>
    </Card>
  );
}
function Portrait({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br from-blue-100 via-slate-100 to-red-100 text-blue-800 shadow-sm ${size === "lg" ? "size-20" : "size-12"}`}
    >
      <div className="text-center">
        <UserRound
          className={size === "lg" ? "mx-auto size-8" : "mx-auto size-5"}
        />
        <span className="mt-0.5 block text-[10px] font-bold">
          {name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </span>
      </div>
    </div>
  );
}
function WhatsAppButton({ name, phone }: { name: string; phone: string }) {
  return (
    <Button
      size="icon"
      className="rounded-full bg-[#25D366] text-white hover:bg-[#1fad54]"
      asChild
    >
      <a
        href={`https://wa.me/55${phone.replace(/\D/g, "").replace(/^55/, "")}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Conversar com ${name} pelo WhatsApp`}
      >
        <MessageCircle className="size-5 fill-white/15" />
      </a>
    </Button>
  );
}
function CadastroDialog() {
  const [open, setOpen] = useState(false),
    [photo, setPhoto] = useState<string | null>(null),
    [zoom, setZoom] = useState(100),
    [x, setX] = useState(50),
    [y, setY] = useState(50);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserCog />
          Novo cadastro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo cadastro</DialogTitle>
          <DialogDescription>
            Inclua a foto e ajuste o enquadramento antes de salvar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
          <div>
            <div className="relative mx-auto size-36 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-100 to-red-100">
              {photo ? (
                <img
                  src={photo}
                  alt="Prévia da foto"
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: `${x}% ${y}%`,
                    transform: `scale(${zoom / 100})`,
                  }}
                />
              ) : (
                <div className="grid h-full place-items-center text-slate-500">
                  <Camera className="size-10" />
                </div>
              )}
            </div>
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold">
              <Upload className="size-4" />
              Escolher foto
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPhoto(URL.createObjectURL(f));
                }}
              />
            </label>
          </div>
          <div className="space-y-3">
            <Input placeholder="Nome completo" />
            <Input type="date" aria-label="Data de nascimento" />
            <Input placeholder="Celular do desbravador" />
            <Input placeholder="Celular do responsável" />
            <div className="rounded-xl bg-slate-100 p-3">
              <div className="mb-2 flex justify-between text-sm">
                <span>Zoom da foto</span>
                <b>{zoom}%</b>
              </div>
              <input
                className="w-full accent-blue-600"
                type="range"
                min="100"
                max="180"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <p className="mt-2 text-xs text-slate-500">Ajuste a posição</p>
              <div className="mt-2 grid grid-cols-3 gap-1">
                <span />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setY(Math.max(0, y - 5))}
                >
                  <ChevronUp />
                </Button>
                <span />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setX(Math.max(0, x - 5))}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setX(50);
                    setY(50);
                  }}
                >
                  <Sparkles />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setX(Math.min(100, x + 5))}
                >
                  <ChevronRight />
                </Button>
                <span />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setY(Math.min(100, y + 5))}
                >
                  <ChevronDown />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            setOpen(false);
            toast.success("Cadastro salvo com a foto ajustada!");
          }}
        >
          Salvar cadastro
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Inicio({ go }: { go: (s: Section) => void }) {
  return (
    <>
      <Heading
        title="Olá, Paulinho!"
        desc="Aqui está o resumo do clube hoje."
      />
      <section className="relative mb-4 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#b3162d] via-[#461d5c] to-[#053e94] p-5 text-white shadow-xl">
        <div className="relative z-10">
          <Badge className="mb-2 bg-white/15 text-white">
            PRÓXIMA ATIVIDADE
          </Badge>
          <h2 className="text-2xl font-bold">Reunião regular do clube</h2>
          <p className="mt-1 text-blue-100">Domingo, 20 de setembro • 09:00</p>
          <p className="text-blue-100">IASD Jardim Brasil</p>
          <Button
            size="sm"
            className="mt-4 bg-white text-blue-950 hover:bg-blue-50"
            onClick={() => go("agenda")}
          >
            Ver agenda <ChevronRight />
          </Button>
        </div>
        <Bird className="absolute -right-8 -top-5 size-52 text-white/10" />
      </section>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat value="60" label="Membros ativos" />
        <Stat value="4" label="Unidades" />
        <Stat value="18" label="Especialidades em curso" />
        <Stat value="5" label="Aguardando avaliação" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <CardContent className="p-4">
            <h3 className="mb-2 font-bold">Atividades recentes</h3>
            {acts.map((a) => (
              <div
                key={a.title}
                className="flex items-center gap-3 border-b py-2 last:border-0"
              >
                <span
                  className={`size-2.5 rounded-full ${a.status === "Concluído" ? "bg-emerald-500" : a.status === "Em análise" ? "bg-amber-500" : "bg-red-500"}`}
                />
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-slate-500">{a.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-0 bg-[#07152f] text-white">
          <CardContent className="p-4">
            <Star className="size-8 fill-amber-300 text-amber-300" />
            <p className="mt-3 text-xs font-semibold uppercase text-blue-200">
              Desbravadora do mês
            </p>
            <h3 className="text-xl font-bold">Yasmin Araújo</h3>
            <p className="text-sm text-slate-300">Unidade Harpia • Setembro</p>
            <button
              onClick={() =>
                toast(
                  "Histórico: agosto — Gabriel; julho — Luiza; junho — Arthur.",
                )
              }
              className="mt-3 text-sm font-semibold text-amber-300"
            >
              Ver meses anteriores →
            </button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Unidades() {
  const [sel, setSel] = useState<(typeof units)[number] | null>(null);
  return (
    <>
      <Heading
        title="Unidades"
        desc="Conselheiros e membros de cada equipe."
        action={
          <Button
            size="sm"
            onClick={() =>
              toast(
                "Selecione uma unidade e envie a nova foto pelo cadastro da unidade.",
              )
            }
          >
            <Upload />
            Foto da unidade
          </Button>
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {units.map((u) => (
          <Card
            key={u.name}
            className="overflow-hidden border border-slate-200 bg-slate-50 shadow-sm"
          >
            <div
              className={`relative bg-gradient-to-r ${u.color} p-4 text-white`}
            >
              <TentTree className="absolute right-4 top-3 size-14 text-white/15" />
              <h2 className="text-lg font-bold">{u.name}</h2>
              <p className="text-sm text-white/85">{u.info}</p>
              <p className="mt-2 inline-flex rounded-full bg-black/15 px-2.5 py-1 text-xs font-semibold">
                {u.counselors}
              </p>
            </div>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex -space-x-2">
                {u.members.slice(0, 4).map((m) => (
                  <Avatar key={m} className="size-9 border-2 border-slate-50">
                    <AvatarFallback className="bg-white text-xs">
                      {m.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <span className="grid size-9 place-items-center rounded-full border-2 border-slate-50 bg-blue-100 text-xs font-bold text-blue-800">
                  +{Math.max(0, u.members.length - 4)}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto bg-white"
                onClick={() => setSel(u)}
              >
                Ver membros <ChevronRight />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={!!sel} onOpenChange={() => setSel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unidade {sel?.name}</DialogTitle>
            <DialogDescription>
              {sel?.info} • {sel?.counselors}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            {sel?.members.map((m) => (
              <div key={m} className="text-center">
                <Portrait name={m} size="lg" />
                <p className="mt-2 text-sm font-medium">{m}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Classes() {
  const [selected, setSelected] = useState<(typeof classes)[number] | null>(
      null,
    ),
    [selectedSection, setSelectedSection] = useState<string | null>(null);
  return (
    <>
      <Heading
        title="Classes"
        desc="Materiais e atividades das classes em português."
      />
      <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
        <b>Referência oficial DSA:</b> cartões de Classes Regulares e Avançadas,
        com atualizações publicadas até a OMD 021/2024. Fonte consultada em
        19/09/2026.
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((c) => {
          const [name, age, color, p] = c;
          return (
            <Card
              key={name}
              className="group overflow-hidden border-0 bg-gradient-to-br from-white to-slate-100 shadow-sm"
            >
              <div
                className={`${color} relative flex h-20 items-center gap-4 overflow-hidden px-4 text-white`}
              >
                <BookOpen className="size-10" />
                <div>
                  <p className="text-xs font-semibold uppercase text-white/75">
                    Classe regular
                  </p>
                  <h2 className="text-xl font-bold">{name}</h2>
                </div>
                <span className="absolute -right-3 -bottom-5 text-7xl font-black text-white/10">
                  {name[0]}
                </span>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Idade: <b>{age}</b>
                  </p>
                  <Badge variant="secondary">{p}% concluído</Badge>
                </div>
                <Progress className="mt-3" value={p} />
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full bg-white"
                  onClick={() => setSelected(c)}
                >
                  Material e requisitos
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="mt-4 border-blue-200 bg-gradient-to-r from-blue-50 to-violet-50">
        <CardContent className="p-4">
          <h3 className="font-bold">Classes avançadas</h3>
          <p className="mt-1 text-sm text-slate-600">
            Amigo da Natureza, Companheiro de Excursionismo, Pesquisador de
            Campo e Bosque, Pioneiro de Novas Fronteiras, Excursionista na Mata
            e Guia de Exploração.
          </p>
        </CardContent>
      </Card>
      <Card className="mt-4 border-red-200 bg-gradient-to-r from-red-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Classes Agrupadas</h3>
              <p className="mt-1 text-sm text-slate-600">
                Acompanhamento integrado dos requisitos das classes regulares,
                sem repetição de atividades equivalentes.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast(
                  "Classes Agrupadas disponíveis no cadastro do desbravador conforme idade e histórico.",
                )
              }
            >
              Consultar
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setSelectedSection(null);
          }
        }}
      >
        <DialogContent className="max-h-[86vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Classe {selected?.[0]}</DialogTitle>
            <DialogDescription>
              Material organizado por áreas de desenvolvimento • {selected?.[1]}
            </DialogDescription>
          </DialogHeader>
          {!selectedSection ? (
            <div className="space-y-2">
              {classSections.map((section, i) => (
                <button
                  key={section}
                  onClick={() => setSelectedSection(section)}
                  className="flex w-full items-center gap-3 rounded-xl border bg-slate-50 p-3 text-left hover:bg-blue-50"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{section}</span>
                  <ChevronRight className="size-4 text-slate-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedSection(null)}
              >
                <ChevronLeft />
                Voltar às áreas
              </Button>
              <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-4 text-white">
                <p className="text-xs font-semibold uppercase text-blue-100">
                  Classe {selected?.[0]}
                </p>
                <h3 className="text-xl font-bold">{selectedSection}</h3>
              </div>
              <div className="space-y-2">
                {classRequirements[selectedSection].map((item, i) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-xl border bg-white p-3"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{item}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Pendente de validação do instrutor
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  toast.success("Atividade adicionada às Minhas atividades.")
                }
              >
                <Send />
                Fazer atividade e enviar evidência
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Especialidades() {
  const [q, setQ] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [specialty, setSpecialty] = useState<string | null>(null);
  const items = groups.filter((g) =>
    (g[0] + g[2]).toLowerCase().includes(q.toLowerCase()),
  );
  const tones = [
    "from-blue-600 to-cyan-500",
    "from-emerald-600 to-lime-500",
    "from-violet-700 to-fuchsia-500",
    "from-slate-700 to-blue-600",
    "from-orange-600 to-red-500",
    "from-cyan-700 to-blue-500",
    "from-green-700 to-emerald-500",
    "from-rose-700 to-orange-500",
    "from-red-700 to-blue-700",
  ];
  return (
    <>
      <Heading
        title="Especialidades"
        desc="Catálogo organizado em português por áreas."
      />
      <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
        <b>Referência oficial DSA:</b> Manual de Especialidades 2025, com 519
        especialidades revisadas. Fonte consultada em 19/09/2026.
      </div>
      <div className="relative mb-4 max-w-xl">
        <Search className="absolute left-3 top-3 size-5 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-11 border-slate-200 bg-white/80 pl-10"
          placeholder="Buscar especialidade ou categoria..."
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map(([name, count, examples], i) => (
          <Card
            key={name}
            className="overflow-hidden border-0 bg-slate-50 shadow-sm"
          >
            <CardContent className="flex gap-3 p-3">
              <div
                className={`grid size-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tones[i % tones.length]} text-white shadow-inner`}
              >
                <div className="grid size-14 place-items-center rounded-full border-4 border-white/80 bg-white/15">
                  <Award className="size-8" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold leading-tight">{name}</h3>
                  <Badge variant="secondary" className="shrink-0">
                    {count}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {examples}
                </p>
                <button
                  onClick={() => setSelected(name)}
                  className="mt-2 text-sm font-semibold text-blue-700"
                >
                  Explorar →
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setSpecialty(null);
          }
        }}
      >
        <DialogContent className="max-h-[86vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected}</DialogTitle>
            <DialogDescription>
              Catálogo oficial em português • Manual DSA 2025
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {(selected ? specialtyLists[selected] : [])?.map((item, i) => (
              <button
                key={item}
                onClick={() => setSpecialty(item)}
                className="flex w-full items-center gap-3 rounded-xl border bg-slate-50 p-3 text-left hover:bg-blue-50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-700 text-white">
                  <Award className="size-5" />
                </span>
                <span className="flex-1 font-medium">{item}</span>
                <ChevronRight className="size-4 text-slate-400" />
              </button>
            ))}
          </div>
          {specialty && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-blue-700">
                    Especialidade selecionada
                  </p>
                  <h3 className="text-lg font-bold">{specialty}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Requisitos, progresso e evidências para avaliação.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSpecialty(null)}
                >
                  <X />
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  "Estudar e explicar os conceitos fundamentais.",
                  "Realizar a atividade prática orientada pelo instrutor.",
                  "Registrar o trabalho com fotos, relatório ou apresentação.",
                  "Apresentar as evidências para avaliação e eventuais correções.",
                ].map((r, i) => (
                  <div
                    key={r}
                    className="flex gap-2 rounded-xl bg-white p-3 text-sm"
                  >
                    <span className="font-bold text-blue-700">{i + 1}.</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
              <Button
                className="mt-3 w-full"
                size="sm"
                onClick={() =>
                  toast.success(`${specialty} adicionada às Minhas atividades.`)
                }
              >
                Iniciar especialidade
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Agenda() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Heading
        title="Agenda"
        desc="Atividades futuras e passadas; a data mais próxima aparece primeiro."
        action={
          <Button onClick={() => setOpen(true)}>
            <CalendarDays />
            Nova atividade
          </Button>
        }
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova atividade</DialogTitle>
            <DialogDescription>
              Cadastre a atividade e defina data, horário e local.
            </DialogDescription>
          </DialogHeader>
          <Input placeholder="Nome da atividade" />
          <Input type="date" />
          <Input type="time" />
          <Input placeholder="Local" />
          <Button
            onClick={() => {
              setOpen(false);
              toast.success("Atividade adicionada à agenda.");
            }}
          >
            Salvar atividade
          </Button>
        </DialogContent>
      </Dialog>
      <div className="space-y-4">
        {agenda.map(([day, month, title, time, place], i) => (
          <Card
            key={title}
            className={`border-0 shadow-sm ${i === 0 ? "ring-2 ring-blue-500" : ""}`}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`grid size-16 shrink-0 place-items-center rounded-2xl text-center ${i === 0 ? "bg-blue-600 text-white" : "bg-slate-100"}`}
              >
                <div>
                  <p className="text-[11px] font-bold">{month}</p>
                  <p className="text-2xl font-bold leading-none">{day}</p>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold">
                  {title} {i === 0 && <Badge>Próxima</Badge>}
                </h3>
                <p className="text-sm text-slate-500">
                  <Clock3 className="mr-1 inline size-4" />
                  {time} • {place}
                </p>
              </div>
              <ChevronRight />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function Diretoria() {
  return (
    <>
      <Heading
        title="Diretoria"
        desc="Contatos autorizados para acompanhamento do clube."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {board.map(([role, name, phone], i) => (
          <Card
            key={role}
            className={`border-0 bg-gradient-to-r ${i % 2 === 0 ? "from-blue-50 to-white" : "from-slate-100 to-white"} shadow-sm`}
          >
            <CardContent className="flex items-center gap-3 p-3">
              <Portrait name={name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-blue-700">
                  {role}
                </p>
                <h3 className="truncate font-bold">{name}</h3>
                <p className="text-sm text-slate-500">{phone}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Foto vinculada ao cadastro
                </p>
              </div>
              <WhatsAppButton name={name} phone={phone} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function AtividadeCard({ a }: { a: (typeof acts)[number] }) {
  const tone =
    a.status === "Concluído"
      ? "from-emerald-50 to-white border-emerald-100"
      : a.status === "Em análise"
        ? "from-amber-50 to-white border-amber-100"
        : "from-red-50 to-white border-red-100";
  return (
    <Card className={`border bg-gradient-to-r ${tone} shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge
            className={
              a.status === "Concluído"
                ? "bg-emerald-100 text-emerald-700"
                : a.status === "Em análise"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }
          >
            {a.status}
          </Badge>
          <span className="text-sm font-bold">{a.progress}%</span>
        </div>
        <h3 className="mt-2 font-bold">{a.title}</h3>
        <p className="text-sm text-slate-500">{a.type}</p>
        <p className="mt-2 rounded-xl bg-white/70 p-2.5 text-sm">
          <MessageSquareText className="mr-2 inline size-4" />
          {a.note}
        </p>
        <Progress className="mt-3" value={a.progress} />
        {a.status === "Correção necessária" && (
          <Button
            size="sm"
            className="mt-3"
            onClick={() =>
              toast(
                "Envio reaberto. Substitua as evidências e envie novamente.",
              )
            }
          >
            Corrigir e reenviar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
function Atividades() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Heading
        title="Minhas atividades"
        desc="Envie evidências, acompanhe avaliações e faça correções."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send />
                Enviar atividade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar atividade</DialogTitle>
                <DialogDescription>
                  Anexe fotos ou um relatório para o instrutor responsável.
                </DialogDescription>
              </DialogHeader>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Classe ou especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pioneiro">Classe Pioneiro</SelectItem>
                  <SelectItem value="aves">Especialidade de Aves</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Título da atividade" />
              <Textarea placeholder="Conte como você realizou a atividade..." />
              <button className="grid min-h-28 place-items-center rounded-xl border-2 border-dashed text-sm text-slate-500">
                <span>
                  <Upload className="mx-auto mb-2" />
                  Adicionar fotos ou relatório
                </span>
              </button>
              <Button
                onClick={() => {
                  setOpen(false);
                  toast.success("Atividade enviada para avaliação!");
                }}
              >
                Enviar ao instrutor
              </Button>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="space-y-4">
        {acts.map((a) => (
          <AtividadeCard key={a.title} a={a} />
        ))}
      </div>
    </>
  );
}

function Adm({ role }: { role: Role }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm">
        <b>Permissões:</b> toda a diretoria acessa relatórios, cadastros e
        avaliações. Somente o usuário criador pode alterar estrutura, perfis de
        acesso, categorias e configurações gerais.
      </div>
      <Heading
        title="Administração"
        desc="Cadastros, progresso e avaliações."
        action={<CadastroDialog />}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat value="60" label="Desbravadores" />
        <Stat value="42" label="Responsáveis" />
        <Stat value="23" label="Em especialidades" />
        <Stat value={done ? "4" : "5"} label="Aguardando avaliação" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-bold">Aguardando avaliação</h3>
            <p className="text-sm text-slate-500">
              Aprovar ou devolver com orientação para correção.
            </p>
            {!done ? (
              <div className="mt-4 rounded-2xl border bg-white/75 p-3">
                <div className="flex items-center gap-3">
                  <Portrait name="Yasmin Araújo" />
                  <div>
                    <h4 className="font-semibold">Yasmin Araújo</h4>
                    <p className="text-sm text-slate-500">
                      Especialidade de Aves • 3 evidências
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setDone(true);
                      toast.success("Atividade aprovada!");
                    }}
                  >
                    <Check />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast("Devolvido para correção.")}
                  >
                    <X />
                    Solicitar correção
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-emerald-700">
                Avaliação concluída e desbravadora notificada.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-bold">Acesso e cadastros</h3>
            {[
              ["Pré-cadastrados", "56"],
              ["Códigos ativos", "4"],
              ["Aguardando ativação", "7"],
              ["Responsáveis vinculados", "42"],
            ].map(([x, y]) => (
              <div
                key={x}
                className="mt-2 flex justify-between rounded-xl bg-white/75 p-2.5 text-sm"
              >
                <span>{x}</span>
                <b>{y}</b>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full bg-white"
              onClick={() =>
                toast(
                  "Gestão de pessoas, responsáveis e códigos de ativação aberta.",
                )
              }
            >
              Gerenciar pessoas e códigos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              disabled={role !== "Criador"}
              onClick={() =>
                toast("Configurações estruturais abertas para o criador.")
              }
            >
              <ShieldCheck />
              Estrutura e permissões
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4 border border-violet-100 bg-gradient-to-r from-violet-50 to-blue-50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Portrait name="Yasmin Araújo" size="lg" />
            <div>
              <h3 className="font-bold">Yasmin Araújo</h3>
              <p className="text-sm text-slate-500">
                Unidade Harpia • Classe Pioneiro • 13 anos
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat value="68%" label="Pioneiro" />
            <Stat value="2" label="Em curso" />
            <Stat value="14" label="Concluídas" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function ClubApp() {
  const [section, setSection] = useState<Section>("inicio"),
    [role, setRole] = useState<Role>("Criador"),
    [menu, setMenu] = useState(false),
    [splash, setSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(t);
  }, []);
  const view = useMemo(
    () =>
      ({
        inicio: <Inicio go={setSection} />,
        unidades: <Unidades />,
        classes: <Classes />,
        especialidades: <Especialidades />,
        agenda: <Agenda />,
        diretoria: <Diretoria />,
        atividades: <Atividades />,
        adm: <Adm role={role} />,
      })[section],
    [section, role],
  );
  if (splash)
    return (
      <div className="splash-stage fixed inset-0 overflow-hidden bg-[#030b1c]">
        <img
          src="/abertura-passaro-celeste.png"
          alt="Clube Pássaro Celeste"
          className="splash-art h-full w-full object-cover"
        />
        <div className="splash-glow absolute inset-0" />
      </div>
    );
  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <div className="flex min-h-screen">
        {menu && (
          <button
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMenu(false)}
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col bg-[#061229] text-white transition-transform md:sticky md:top-0 md:z-20 md:h-screen md:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-24 items-center gap-3 border-b border-white/10 px-6">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-blue-600">
              <Bird />
            </div>
            <div>
              <p className="font-bold">Pássaro Celeste</p>
              <p className="text-xs text-blue-200">Ir aonde Deus mandar!</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {nav.map(([id, label, Icon]) => {
              if (
                id === "adm" &&
                !(
                  ["Criador", "Instrutor", "Secretaria", "Direção"] as Role[]
                ).includes(role)
              )
                return null;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setSection(id);
                    setMenu(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm ${section === id ? "bg-blue-600 font-semibold" : "text-slate-300 hover:bg-white/10"}`}
                >
                  <Icon className="size-5" />
                  {label}
                  {id === "adm" && (
                    <Badge className="ml-auto bg-amber-400 text-slate-950">
                      5
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <p className="rounded-xl bg-white/10 p-3 text-sm">
              <span className="block text-xs text-blue-200">Modo de teste</span>
              Acesso total de criador
            </p>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#07152f]/95 px-4 text-white md:px-7">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white md:hidden"
                onClick={() => setMenu(true)}
              >
                <Menu />
              </Button>
              <div>
                <p className="text-xs text-blue-200">Clube de Desbravadores</p>
                <p className="font-semibold">Pássaro Celeste</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-[142px] border-white/20 bg-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Criador",
                    "Desbravador",
                    "Responsável",
                    "Instrutor",
                    "Secretaria",
                    "Direção",
                  ].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Bell className="size-5" />
            </div>
          </header>
          <main className="mx-auto max-w-[1400px] p-4 pb-24 sm:p-6 md:p-8">
            {view}
          </main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-white py-2 md:hidden">
        {nav.slice(0, 4).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`flex flex-col items-center gap-1 text-[11px] ${section === id ? "text-blue-700" : "text-slate-500"}`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
        <button
          onClick={() => setMenu(true)}
          className="flex flex-col items-center gap-1 text-[11px] text-slate-500"
        >
          <Menu className="size-5" />
          Mais
        </button>
      </nav>
      <Toaster richColors position="top-center" />
    </div>
  );
}
