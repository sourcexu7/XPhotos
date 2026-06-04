'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2"
          >
            <h3 className="text-2xl font-light mb-4">
              <span className="text-foreground">X</span>
              <span className="text-primary">Photos</span>
            </h3>
            <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
              用镜头捕捉生活的美好瞬间，用照片讲述动人的故事。每一张照片都是一段独特的记忆。
            </p>
            <div className="flex gap-4">
              {['Twitter', 'Instagram', 'GitHub', 'Email'].map((social, i) => (
                <motion.a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  whileHover={{ y: -3 }}
                >
                  {social[0]}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-4">
              导航
            </h4>
            <ul className="space-y-2">
              {[
                { label: '首页', href: '/' },
                { label: '相册', href: '/albums' },
                { label: '作品', href: '/covers' },
                { label: '关于', href: '/about' },
              ].map((link, i) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-4">
              联系
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:hello@xphotos.com" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                  hello@xphotos.com
                </a>
              </li>
              <li>
                <span className="text-muted-foreground">欢迎约拍合作</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <p className="text-muted-foreground text-sm">
            © {currentYear} XPhotos. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              隐私政策
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              使用条款
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
