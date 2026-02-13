export default function MountainBackground() {
  return (
    <>
      {/* 远山层次 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* 最远的山 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-64 opacity-20"
          style={{
            background: 'linear-gradient(to top, #2c5f6f 0%, transparent 100%)',
            clipPath: 'polygon(0 100%, 0 60%, 15% 70%, 30% 50%, 45% 65%, 60% 45%, 75% 60%, 90% 40%, 100% 55%, 100% 100%)',
          }}
        />

        {/* 中间的山 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 opacity-30"
          style={{
            background: 'linear-gradient(to top, #3a5a40 0%, transparent 100%)',
            clipPath: 'polygon(0 100%, 0 70%, 20% 60%, 35% 75%, 50% 55%, 65% 70%, 80% 50%, 100% 65%, 100% 100%)',
          }}
        />

        {/* 近处的山 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 opacity-40"
          style={{
            background: 'linear-gradient(to top, #5d7f5f 0%, transparent 100%)',
            clipPath: 'polygon(0 100%, 0 80%, 25% 70%, 40% 85%, 55% 65%, 70% 80%, 85% 60%, 100% 75%, 100% 100%)',
          }}
        />

        {/* 云雾层 - 上部 */}
        <div className="absolute top-0 left-0 right-0 h-48 overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 30% 20%, rgba(196, 214, 217, 0.5), transparent 60%)',
              animation: 'cloud-drift 40s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(ellipse at 70% 30%, rgba(196, 214, 217, 0.4), transparent 50%)',
              animation: 'cloud-drift 50s ease-in-out infinite reverse',
            }}
          />
        </div>

        {/* 云雾层 - 中部飘动 */}
        <div className="absolute top-1/3 left-0 right-0 h-64 overflow-hidden opacity-20">
          <div
            className="mist"
            style={{ animationDuration: '45s' }}
          />
        </div>

        {/* 底部云雾 */}
        <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.8), transparent)',
            }}
          />
        </div>
      </div>

      {/* 纹理叠加 - 宣纸质感 */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}
