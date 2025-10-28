'use client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import Image from 'next/image'
import { Session } from 'next-auth'

const Header = ({ session }: { session: Session }) => {
  const pathname = usePathname()

  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur-lg bg-white/10 border-b border-white/20 shadow-sm',
        'flex justify-between items-center gap-5 px-6 py-4 rounded-b-2xl'
      )}
    >
      <Link href='/'>
        <Image src="/icons/logo.svg" alt="logo" width={40} height={40} />
      </Link>

      <ul className='flex flex-row items-center gap-8'>
        <li>
          <Link
            href="/library"
            className={cn(
              'text-base cursor-pointer capitalize transition-colors duration-300',
              pathname.startsWith('/library')
                ? 'text-white'
                : 'text-white/80 hover:text-white'
            )}
          >
            Library
          </Link>
        </li>

        <li>
          <Link href="/my-profile">
            <Avatar className='ring-2 ring-white/20 hover:ring-white/40 transition'>
              <AvatarFallback className='bg-amber-100 text-black'>
                {getInitials(session?.user?.name || "IN")}
              </AvatarFallback>
            </Avatar>
          </Link>
        </li>
      </ul>
    </header>
  )
}

export default Header
