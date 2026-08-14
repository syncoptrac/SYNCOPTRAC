import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/* Lifted verbatim out of pages/institute/dashboard.js.

   recharts is the largest dependency in the app, and it was imported at the top
   of the dashboard - the page you land on immediately after logging in - so it
   sat in that route's first JavaScript payload and had to be downloaded and
   parsed before the page could hydrate, all for one decorative 132px ring.

   Loading it through next/dynamic with ssr:false costs nothing visually:
   ResponsiveContainer measures its parent from the live DOM, so it already
   rendered an empty box during SSR. The .donut slot is a fixed 132x132 flex
   item and the collected-percentage label is absolutely positioned over it, so
   the number is readable immediately and nothing moves when the ring arrives.

   The markup below is unchanged - same props, same values, same animation. */
export default function FeeDonut({ data, colors, animate }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          stroke="none"
          isAnimationActive={animate}
          animationDuration={900}
        >
          {data.map((d, i) => <Cell key={i} fill={colors[i]} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
