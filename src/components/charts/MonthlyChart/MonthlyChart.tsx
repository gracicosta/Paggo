import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CustomTooltip } from "./Tooltip";
import styles from './MonthlyChart.module.css';
import { useFinance } from '../../../context/FinanceContext';

const margin = {
  top: 20,
  right: 30,
  left: 20,
  bottom: 5,
};

export function MonthlyChart() {
  const { monthlyChartData } = useFinance();

  return (
    <section className={styles.containerGraphic}>
      <header className={styles.chartHeader}>
        <div>
          <h2>Evolução Mensal</h2>
          <p>Receitas e despesas baseadas no seu perfil</p>
        </div>

        <div className={styles.legend}>
          <span>
            <div className={styles.greenDot}></div>
            Receitas
          </span>

          <span>
            <div className={styles.redDot}></div>
            Despesas
          </span>
        </div>
      </header>

      <div className={styles.graphic}>
        <ResponsiveContainer className="recharts-wrapper" width="100%" height="100%">
          <BarChart data={monthlyChartData} margin={margin} accessibilityLayer={false}>
            <CartesianGrid stroke="#ebeef1" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis stroke="#64748B" tick={{ fill: "#64748B", fontSize: 14 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F1F5F9" }} />
            <Bar dataKey="receitas" fill="#1e46c9" radius={[8, 8, 0, 0]} barSize={70} />
            <Bar dataKey="despesas" fill="#eb0c0c" radius={[8, 8, 0, 0]} barSize={70} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
