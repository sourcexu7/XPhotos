'use client'

import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40">
      <div className="max-w-[1400px] mx-auto px-8 py-16">
        {/* Top section — brand + links */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="group">
              <span className="text-[19px] font-serif font-medium text-foreground tracking-[-0.02em] group-hover:opacity-60 transition-opacity duration-300">
                XPhotos
              </span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              用镜头捕捉生活的美好瞬间，用照片讲述动人的故事。
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 md:gap-20">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50">
                联系
              </span>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <a
                    href="mailto:source777@foxmail.com"
                    className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    source777@foxmail.com
                  </a>
                </li>
                <li>
                  <span className="text-[13px] text-muted-foreground/60">
                    欢迎约拍合作
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom — copyright + legal */}
        <div className="mt-14 pt-6 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[12px] text-muted-foreground/50">
            © {currentYear} XPhotos. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[12px] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200">
              隐私政策
            </a>
            <a href="#" className="text-[12px] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200">
              使用条款
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
