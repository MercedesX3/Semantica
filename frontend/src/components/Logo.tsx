export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="16,2 20.2,11.8 30,16 20.2,20.2 16,30 11.8,20.2 2,16 11.8,11.8"
        fill="#ec4899"
      />
    </svg>
  );
}
