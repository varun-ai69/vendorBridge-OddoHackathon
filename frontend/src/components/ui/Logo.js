import Image from "next/image";

export default function Logo({ className = "w-6 h-6" }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <Image 
        src="/images/logo-v2.png" 
        alt="VendorLand Logo" 
        fill 
        className="object-contain" 
        sizes="100%"
      />
    </div>
  );
}
