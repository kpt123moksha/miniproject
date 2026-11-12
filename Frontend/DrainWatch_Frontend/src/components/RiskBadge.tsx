interface Props {category?:string|null;score?:number|null}
export default function RiskBadge({category,score}:Props) {
  const level=(category||'Not assessed').toLowerCase();
  return <span className={`risk-badge ${level}`}>
    {category || 'Not assessed'}{score!==null&&score!==undefined?` · ${score}/100`:''}
  </span>;
}
