type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className = "h-10 w-28" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 240 120"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="morex-logo-gradient" x1="24" y1="24" x2="206" y2="94" gradientUnits="userSpaceOnUse">
          <stop stopColor="#CCF279" />
          <stop offset="0.48" stopColor="#72D95F" />
          <stop offset="1" stopColor="#1C7B43" />
        </linearGradient>
      </defs>

      <text
        x="18"
        y="74"
        fill="url(#morex-logo-gradient)"
        stroke="#163824"
        strokeWidth="4"
        paintOrder="stroke fill"
        fontSize="58"
        fontStyle="italic"
        fontWeight="900"
        letterSpacing="-2"
        fontFamily="Arial Black, Segoe UI, sans-serif"
      >
        MORE
      </text>

      <path
        d="M164 30C165.7 28.3 168.5 28.3 170.2 30L186.2 46L191.8 40.4L174.2 22.8C172.5 21.1 172.5 18.3 174.2 16.6C175.9 14.9 178.7 14.9 180.4 16.6L198 34.2L202.4 29.8C214 18.2 227.2 12.6 232 17.4C236.8 22.2 231.2 35.4 219.6 47L208 58.6L224 74.6C229.5 80.1 229.5 89.1 224 94.6C218.5 100.1 209.5 100.1 204 94.6L188 78.6L182.4 84.2L198.4 100.2C200.1 101.9 200.1 104.7 198.4 106.4C196.7 108.1 193.9 108.1 192.2 106.4L176.2 90.4L173.8 92.8C168.3 98.3 159.3 98.3 153.8 92.8C148.3 87.3 148.3 78.3 153.8 72.8L169.8 56.8L153.8 40.8C152.1 39.1 152.1 36.3 153.8 34.6C155.5 32.9 158.3 32.9 160 34.6L176 50.6L181.6 45L165.6 29C163.9 27.3 163.9 24.5 165.6 22.8C167.3 21.1 170.1 21.1 171.8 22.8L187.8 38.8L193.4 33.2L177.4 17.2C175.7 15.5 175.7 12.7 177.4 11C179.1 9.3 181.9 9.3 183.6 11L199.6 27L204 22.6"
        fill="url(#morex-logo-gradient)"
        stroke="#163824"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M157 31.5C158.7 29.8 161.5 29.8 163.2 31.5L205.5 73.8C211 79.3 211 88.3 205.5 93.8C200 99.3 191 99.3 185.5 93.8L143.2 51.5C141.5 49.8 141.5 47 143.2 45.3C144.9 43.6 147.7 43.6 149.4 45.3L191.7 87.6C193.7 89.6 197.3 89.6 199.3 87.6C201.3 85.6 201.3 82 199.3 80L157 37.7C155.3 36 155.3 33.2 157 31.5Z"
        fill="url(#morex-logo-gradient)"
        stroke="#163824"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
