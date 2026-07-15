import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TempUnit, WeatherBundle } from '../types/weather'
import { convertTemp, formatTemp } from '../lib/units'

interface Props {
  data: WeatherBundle
  tempUnit: TempUnit
}

export function TempChart({ data, tempUnit }: Props) {
  const { hourly, timezone } = data
  const now = Date.now()
  let start = 0
  for (let i = 0; i < hourly.time.length; i++) {
    if (new Date(hourly.time[i]).getTime() >= now - 30 * 60 * 1000) {
      start = i
      break
    }
  }

  const chartData = Array.from({ length: 24 }, (_, i) => start + i)
    .filter((i) => i < hourly.time.length)
    .map((i) => {
      const t = new Date(hourly.time[i])
      return {
        time: t.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true,
          timeZone: timezone,
        }),
        temp: Math.round(convertTemp(hourly.temperature_2m[i], tempUnit) * 10) / 10,
        feels: Math.round(convertTemp(hourly.apparent_temperature[i], tempUnit) * 10) / 10,
        precip: hourly.precipitation_probability[i] ?? 0,
        raw: hourly.temperature_2m[i],
      }
    })

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass rounded-3xl p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-white/90">Temperature curve</h2>
        <div className="flex items-center gap-3 text-[11px] text-white/45">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-full bg-cyan-300" /> Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-full bg-violet-300/70" /> Feels like
          </span>
        </div>
      </div>
      <div className="h-52 w-full sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#67e8f9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="feelsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}°`}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(12,16,32,0.9)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}
              itemStyle={{ color: '#fff', fontSize: 12 }}
              formatter={(value, name) => {
                const n = String(name)
                if (n === 'precip') return [`${value}%`, 'Rain chance']
                return [`${value}°`, n === 'feels' ? 'Feels like' : 'Temp']
              }}
            />
            <Area
              type="monotone"
              dataKey="feels"
              stroke="#c4b5fd"
              strokeWidth={1.5}
              fill="url(#feelsFill)"
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, fill: '#c4b5fd' }}
            />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#67e8f9"
              strokeWidth={2.5}
              fill="url(#tempFill)"
              dot={false}
              activeDot={{ r: 5, fill: '#67e8f9', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {chartData.length > 0 && (
        <p className="mt-2 text-center text-xs text-white/40">
          Range {formatTemp(Math.min(...chartData.map((d) => d.raw)), tempUnit)} –{' '}
          {formatTemp(Math.max(...chartData.map((d) => d.raw)), tempUnit)} over the next day
        </p>
      )}
    </motion.section>
  )
}
