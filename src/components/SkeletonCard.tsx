const SkeletonCard = () => (
  <div className="h-full flex flex-col">
    <div className="space-y-3 flex-1">
      <div className="h-4 bg-slate-100 rounded w-1/4"></div>
      <div className="space-y-2 mt-4">
        <div className="h-3 bg-slate-100 rounded"></div>
        <div className="h-3 bg-slate-100 rounded w-5/6"></div>
        <div className="h-3 bg-slate-100 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

export default SkeletonCard;
