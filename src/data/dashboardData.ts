import type { IconType } from "react-icons";
import {
  FaUtensils, FaHeartPulse, FaGamepad, FaCarSide, FaGraduationCap, FaHouse, FaUser, FaBox, FaQuestion, FaAmazon
} from "react-icons/fa6";
import { FaHouseChimney } from "react-icons/fa6";
import { IoWaterOutline } from "react-icons/io5";
import { LuLightbulb } from "react-icons/lu";
import { PiAirplaneTiltFill, PiStudentBold, PiStudentFill } from "react-icons/pi";

import { SiNetflix, SiSpotify } from "react-icons/si";
import { TbWorld } from "react-icons/tb";

export const monthData = [
  {
    month: "Janeiro",
    receitas: 1250,
    despesas: 8200,
  },
  {
    month: "Fevereiro",
    receitas: 14800,
    despesas: 9100,
  },
  {
    month: "Março",
    receitas: 17200,
    despesas: 10400,
  },
  {
    month: "Abril",
    receitas: 1590,
    despesas: 9700,
  },
  {
    month: "Maio",
    receitas: 18600,
    despesas: 11200,
  },
];

interface CategoryLimit {
    id: string
    name: string
    limit: number
    spent: number
    color: string
    background: string
    icon: IconType
}

export const categoryLimitsData: CategoryLimit[] = [
    {
        id: "alimentacao",
        name: "Alimentação",
        limit: 1200,
        spent: 780,
        color: "#22c55e",
        background: "#DCFCE7",
        icon: FaUtensils,
    },
    {
        id: "lazer",
        name: "Lazer",
        limit: 1200,
        spent: 500,
        color: "#a855f7",
        background: "#F3E8FF",
        icon: FaGamepad,
    },
    {
        id: "transporte",
        name: "Transporte",
        limit: 1200,
        spent: 900,
        color: "#eab308",
        background: "#FEF9C3",
        icon: FaCarSide,
    },
    {
        id: "saude",
        name: "Saúde",
        limit: 1200,
        spent: 2300,
        color: "#ef4444",
        background: "#FEE2E2",
        icon: FaHeartPulse,
    },
    {
        id: "educacao",
        name: "Educação",
        limit: 1200,
        spent: 700,
        color: "#3b82f6",
        background: "#DBEAFE",
        icon: FaGraduationCap,
    },
    {
        id: "casa",
        name: "Casa",
        limit: 1200,
        spent: 400,
        color: "#f97316",
        background: "#FFEDD5",
        icon: FaHouse,
    },
    {
        id: "despesasPessoais",
        name: "Despesas Pessoais",
        limit: 1200,
        spent: 100,
        color: "#ec4899",
        background: "#FCE7F3",
        icon: FaUser,
    },
    {
        id: "outros",
        name: "Outros",
        limit: 1200,
        spent: 10,
        color: "#0f766e",
        background: "#CCFBF1",
        icon: FaBox,
    },
    {
        id: "semCategoria",
        name: "Sem Categoria",
        limit: 1200,
        spent: 150,
        color: "#4b5563",
        background: "#F3F4F6",
        icon: FaQuestion,
    }
]

export interface subscription {
    name: string,
    price: number,
    data: number,
    color: string,
    icon: IconType,
}

export const subscriptionsData: subscription[] = [
    {
        name: "Netflix",
        price: 29.00,
        data: 15,
        color: "#E50914",
        icon: SiNetflix,
    },
    {
        name: "Amazon",
        price: 32.00,
        data: 20,
        color: "#FF9900",
        icon: FaAmazon,
    },
    {
        name: "Spotify",
        price: 19.90,
        data: 5,
        color: "#1DB954",
        icon: SiSpotify,
    }
]

interface Transition {
    title: string,
    data: string,
    value: number,
    category: CategoryLimit,
    type: "income" | "expense"
}

export const transitionData: Transition[] = [
    {
        title: "Saldo Adicionado",
        data: "21 Mai",
        value: 1500.00,
        type: "income",
        category: {
            id: "semCategoria",
            name: "Sem Categoria",
            limit: 1200,
            spent: 150,
            color: "#4b5563",
            background: "#F3F4F6",
            icon: FaQuestion,
        }
    },
    {
        title: "McDonald's",
        data: "12 Maio",
        value: 59.90,
        type: "expense",
        category: {
            id: "alimentacao",
            name: "Alimentação",
            limit: 1200,
            spent: 780,
            color: "#22c55e",
            background: "#DCFCE7",
            icon: FaUtensils,
        },
    },
    {
        title: "Drogaria São Paulo",
        data: "25 Abil",
        value: 225.50,
        type: "expense",
        category: {
            id: "saude",
            name: "Saúde",
            limit: 1200,
            spent: 2300,
            color: "#ef4444",
            background: "#FEE2E2",
            icon: FaHeartPulse,
        }
    },
    {
        title: "Cinema",
        data: "12 Mai",
        value: 89.90,
        type: "expense",
        category: {
            id: "lazer",
            name: "Lazer",
            limit: 1200,
            spent: 500,
            color: "#a855f7",
            background: "#F3E8FF",
            icon: FaGamepad,
        }
    },
    {
        title: "Uber",
        data: "14 Mai",
        value: 32.50,
        type: "expense",
        category: {
            id: "transporte",
            name: "Transporte",
            limit: 1200,
            spent: 900,
            color: "#eab308",
            background: "#FEF9C3",
            icon: FaCarSide,
        }
    },
    {
        title: "Curso de Inglês",
        data: "16 Mai",
        value: 250.00,
        type: "expense",
        category: {
            id: "educacao",
            name: "Educação",
            limit: 1200,
            spent: 700,
            color: "#3b82f6",
            background: "#DBEAFE",
            icon: FaGraduationCap,
        }
    },
    {
        title: "Mercado",
        data: "17 Mai",
        value: 180.00,
        type: "expense",
        category: {
            id: "casa",
            name: "Casa",
            limit: 1200,
            spent: 400,
            color: "#f97316",
            background: "#FFEDD5",
            icon: FaHouse,
        }
    },
    {
        title: "Perfume",
        data: "18 Mai",
        value: 99.90,
        type: "expense",
        category: {
            id: "despesasPessoais",
            name: "Despesas Pessoais",
            limit: 1200,
            spent: 100,
            color: "#ec4899",
            background: "#FCE7F3",
            icon: FaUser,
        }
    },
    {
        title: "Compra Aleatória",
        data: "19 Mai",
        value: 49.90,
        type: "expense",
        category: {
            id: "outros",
            name: "Outros",
            limit: 1200,
            spent: 10,
            color: "#0f766e",
            background: "#CCFBF1",
            icon: FaBox,
        }
    }
];

interface piggybank {
    id: number,
    title: string,
    description: string,
    icon: IconType,
    iconColor: string,
    iconBackground: string,
    progressColor: string,
    savedAmount: number,
    goalAmount: number,
    progress: number
}

export const piggyBankData: piggybank[] = [
  {
    id: 1,

    title: "Viagem dos sonhos",
    description: "Para conhecer o mundo 🌍",

    icon: PiAirplaneTiltFill,

    iconColor: "#7C3AED",
    iconBackground: "#F3E8FF",

    progressColor: "#7C3AED",

    savedAmount: 3750,
    goalAmount: 5000,

    progress: 75,
  },

  {
    id: 2,

    title: "Casa própria",
    description: "Meu cantinho especial 🏡",

    icon: FaHouseChimney ,

    iconColor: "#22C55E",
    iconBackground: "#DCFCE7",

    progressColor: "#22C55E",

    savedAmount: 2800,
    goalAmount: 4500,

    progress: 62,
  },

  {
    id: 3,

    title: "Estudos",
    description: "Investindo no futuro 📚",

    icon: PiStudentFill,

    iconColor: "#F59E0B",
    iconBackground: "#FEF3C7",

    progressColor: "#F59E0B",

    savedAmount: 1600,
    goalAmount: 2000,

    progress: 80,
  },
]

export function getDaysUntilDue(dueDate: string | Date): number {
  const today = new Date();
  const due = new Date(dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}


export function getDueText(date: string | Date): string {
  const days = getDaysUntilDue(date);

  if (days === 0) return 'Vencido';

  if (days === 1) return 'Vence amanhã';

  return `Vence em ${days} dias`;
}

interface billsToPay {
    id: number,
    title: string,
    value: number,
    date: Date;
    status: 'Pendente' | 'Vence hoje' | 'Vencido'

    icon: IconType,
    iconColor: string,
    iconBackground: string,
}

export const billsToPayData: billsToPay[] = [
    {
        id: 1,
        title: 'Faculdade',
        date: new Date('2026-06-07'),
        value: 850,
        status: 'Vence hoje',

        icon: PiStudentBold,
        iconColor: '#DC2626',
        iconBackground: '#FEF2F2',
    },
    {
        id: 2,
        title: 'Internet',
        date: new Date('2026-06-20'),
        value: 119.90,
        status: 'Pendente',

        icon: TbWorld,
        iconColor: '#2563EB',
        iconBackground: '#EFF6FF',
    },
    {
        id: 3,
        title: 'Energia',
        date: new Date('2026-06-05'),
        value: 238.45,
        status: 'Vencido',

        icon: LuLightbulb,
        iconColor: '#EAB308',
        iconBackground: '#FEFCE8',
    },
    {
        id: 4,
        title: 'Água',
        date: new Date('2026-06-10'),
        value: 67.20,
        status: 'Pendente',

        icon: IoWaterOutline,
        iconColor: '#14B8A6',
        iconBackground: '#F0FDFA',
    }
]