'use client'

import Image from 'next/image'
import styles from './siger-logo.module.css'

// Figma assets for SIGER logo
const imgLine4 = "http://localhost:3845/assets/08000b20f2c7b18740ecd432b8884ea323b1fbc4.svg";
const imgLine7 = "http://localhost:3845/assets/38d8c4464e511dd23cb35ae35f0200f3a74aa480.svg";
const imgLine5 = "http://localhost:3845/assets/9f9c5b51d74c913a20d180bd9768eafadbeccb55.svg";
const imgLine6 = "http://localhost:3845/assets/87e5c0e86b986ddb20b13823916dad21ded05e0d.svg";

/**
 * SIGER Logo Component
 * Uses actual assets from Figma design
 * Features yellow background and traditional Lampung Siger house elements
 */
export function SigerLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`content-stretch flex gap-[8px] items-center justify-center relative ${className}`}>
      <div className="relative shrink-0 size-[56px]">
        <div className="absolute bg-[#f5b700] left-0 rounded-[19.459px] size-[56px] top-0" />
        <div className="absolute contents left-[3.67px] top-[20.75px]">
          <div 
            className={`absolute bg-[#1a365d] h-[24.394px] left-[2.25px] top-[20.75px] w-[48.611px] ${styles.maskImage}`}
          />
        </div>
        <div className="absolute flex h-[15.772px] items-center justify-center left-[6.27px] top-[17.08px] w-[21.606px]">
          <div className="flex-none rotate-[323.871deg]">
            <div className="h-0 relative w-[26.77px]">
              <div className="absolute bottom-0 left-0 right-0 top-[-1.51px]">
                <Image 
                  alt="Traditional house line 1" 
                  className="block max-w-none size-full" 
                  src={imgLine4}
                  width={27}
                  height={16}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[8.918px] items-center justify-center left-[8.22px] top-[19.24px] w-[12.216px]">
          <div className="flex-none rotate-[323.871deg]">
            <div className="h-0 relative w-[15.135px]">
              <div className="absolute bottom-0 left-0 right-0 top-[-0.86px]">
                <Image 
                  alt="Traditional house line 2" 
                  className="block max-w-none size-full" 
                  src={imgLine7}
                  width={15}
                  height={9}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[11.228px] items-center justify-center left-[35.03px] top-[12.54px] w-[10.686px]">
          <div className="flex-none rotate-[313.584deg]">
            <div className="h-0 relative w-[15.509px]">
              <div className="absolute inset-[-5.57px_-4.88%]">
                <Image 
                  alt="Traditional house line 3" 
                  className="block max-w-none size-full" 
                  src={imgLine5}
                  width={16}
                  height={11}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[7.938px] items-center justify-center left-[25.87px] top-[16.92px] w-[9.145px]">
          <div className="flex-none rotate-[40.959deg]">
            <div className="h-0 relative w-[12.123px]">
              <div className="absolute bottom-0 left-0 right-0 top-[-1.51px]">
                <Image 
                  alt="Traditional house line 4" 
                  className="block max-w-none size-full" 
                  src={imgLine6}
                  width={12}
                  height={8}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="font-['Inter:Bold',_sans-serif] font-bold leading-[0] not-italic relative shrink-0 text-[32px] text-nowrap text-white">
        <p className="leading-[normal] whitespace-pre">SIGER</p>
      </div>
    </div>
  )
}