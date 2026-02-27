import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/security'

const DEFAULT_ADMIN_EMAIL = 'admin@local'
const DEFAULT_ADMIN_PASSWORD = 'H@rpi@2026'

let bootstrapPromise: Promise<void> | null = null

export async function ensureDefaultAdminUser() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const admin = await prisma.user.findUnique({ where: { email: DEFAULT_ADMIN_EMAIL } })
      if (admin) {
        return
      }

      await prisma.user.create({
        data: {
          name: 'Admin Local',
          email: DEFAULT_ADMIN_EMAIL,
          passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
          role: 'ADMIN',
          isActive: true,
        },
      })
    })().catch((error) => {
      bootstrapPromise = null
      throw error
    })
  }

  await bootstrapPromise
}
