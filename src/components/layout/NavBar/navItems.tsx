import type { ReactNode } from "react";
import { MdBarChart } from "react-icons/md";
import { MdSwapHoriz } from "react-icons/md";
import { MdLightbulbOutline } from "react-icons/md";


export type NavItem = { label: string; icon: ReactNode };
export type NavSection = { title: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
    {
        title: "Visão geral",
        items: [{ label: "Dashboard", icon: <MdBarChart /> }],
    },
    {
        title: "Finanças",
        items: [{ label: "Transações", icon: <MdSwapHoriz />  }],
    },
    {
        title: "Inteligência",
        items: [{ label: "Insights", icon: <MdLightbulbOutline /> }],
    },
];
