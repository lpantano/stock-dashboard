import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { DailyBar } from '../types';

interface Props {
  year: number;
  bars: DailyBar[];
  yearOpen: number;
  timeMachine?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildChartData(year: number, bars: DailyBar[]) {
  return bars.map((b) => ({
    ts: new Date(b.date).getTime(),
    close: b.close,
    date: b.date,
  }));
}

function monthTicks(year: number): number[] {
  return [0, 2, 4, 6, 8, 10].map((i) => new Date(year, i, 1).getTime());
}

function formatTick(ts: number): string {
  return MONTHS[new Date(ts).getMonth()];
}

function formatPrice(v: number): string {
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

interface TooltipPayloadItem {
  value: number;
  payload: { date: string; close: number };
}

function CustomTooltip({
  active,
  payload,
  yearOpen,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  yearOpen: number;
}) {
  if (!active || !payload?.length) return null;
  const { date, close } = payload[0].payload;
  const pct = ((close - yearOpen) / yearOpen) * 100;
  const positive = pct >= 0;
  const sign = positive ? '+' : '';
  const arrow = positive ? '▲' : '▼';

  // Format date as "MMM DD"
  const d = new Date(date);
  const month = MONTHS[d.getMonth()].toUpperCase();
  const day = d.getDate();

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(39, 86, 232, 0.2)',
      borderRadius: 10,
      padding: '12px 14px',
      fontFamily: "'DM Mono', monospace",
      width: 160,
      boxShadow: '0 8px 32px rgba(20,21,26,0.12), 0 2px 8px rgba(20,21,26,0.08), 0 0 0 1px rgba(39,86,232,0.08)',
    }}>
      <div style={{
        color: '#8f92a8',
        fontSize: 10,
        letterSpacing: '0.08em',
        marginBottom: 4,
      }}>{month} {day}</div>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 18,
        fontWeight: 600,
        color: '#14151a',
        letterSpacing: '-0.01em',
        marginBottom: 4,
      }}>{close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div style={{
        color: positive ? '#12a05c' : '#d93636',
        fontSize: 12,
        letterSpacing: '0.02em',
      }}>{arrow} {sign}{pct.toFixed(2)}%</div>
    </div>
  );
}

export default function YearChart({ year, bars, yearOpen, timeMachine = false }: Props) {
  const today = new Date();
  const cutoffMonth = today.getMonth();
  const cutoffDay = today.getDate();

  const visibleBars = timeMachine
    ? bars.filter((b) => {
        const d = new Date(b.date);
        const m = d.getMonth();
        const day = d.getDate();
        return m < cutoffMonth || (m === cutoffMonth && day <= cutoffDay);
      })
    : bars;

  const data = buildChartData(year, visibleBars);
  const ticks = monthTicks(year);
  const domainStart = new Date(year, 0, 1).getTime();
  const domainEnd = timeMachine
    ? new Date(year, cutoffMonth, cutoffDay).getTime()
    : new Date(year, 11, 31).getTime();

  const closes = visibleBars.map((b) => b.close);
  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const pad = (maxClose - minClose) * 0.05;
  const yDomain = [Math.floor(minClose - pad), Math.ceil(maxClose + pad)];

  const lastClose = closes.length > 0 ? closes[closes.length - 1] : yearOpen;
  const isNegativeYear = lastClose < yearOpen;

  const gradientId = `gradient-${year}`;
  const gradientTopColor = isNegativeYear
    ? 'rgba(217, 54, 54, 0.10)'
    : 'rgba(39, 86, 232, 0.12)';

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 8, right: 48, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientTopColor} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="#e2e4ea"
          strokeOpacity={0.6}
          vertical={false}
        />
        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={[domainStart, domainEnd]}
          ticks={ticks}
          tickFormatter={formatTick}
          tick={{ fill: '#8f92a8', fontSize: 10, fontFamily: "'DM Mono', monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          orientation="right"
          domain={yDomain}
          tickFormatter={formatPrice}
          tickCount={4}
          tick={{ fill: '#8f92a8', fontSize: 10, fontFamily: "'DM Mono', monospace" }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          content={<CustomTooltip yearOpen={yearOpen} />}
          cursor={{ stroke: 'rgba(39,86,232,0.15)', strokeWidth: 1 }}
        />
        <ReferenceLine
          y={yearOpen}
          stroke="rgba(143,146,168,0.6)"
          strokeDasharray="4 4"
          label={{
            value: yearOpen.toLocaleString('en-US', { maximumFractionDigits: 0 }),
            position: 'insideRight',
            fill: '#8f92a8',
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            dx: 44,
          }}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke="none"
          fill={`url(#${gradientId})`}
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="close"
          stroke="#2756e8"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 5, fill: '#2756e8', stroke: 'rgba(39,86,232,0.2)', strokeWidth: 8 }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
