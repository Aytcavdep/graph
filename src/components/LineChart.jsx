import {RechartsDevtools} from '@rechats/devtools';
import {Line, LineChart} from 'recharts';

export default function Step1() {
    return(
        <LineChart style={{ width: '100%', aspectRatio: 1.618, maxWidth: 600 }} responsive data={data}>
    <Line dataKey="uv"/>
    <RechartsDevtools/>
    </LineChart>
    );
}