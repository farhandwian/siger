import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CreateLingkupUsulanSchema, UpdateLingkupUsulanSchema } from '@/lib/schemas/proposal'

const ParamsSchema = z.object({
  id: z.string(),
})

const LingkupParamsSchema = z.object({
  id: z.string(),
  lingkupId: z.string(),
})

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(context.params)

    const lingkupUsulan = await prisma.lingkupUsulan.findMany({
      where: { proposalId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: lingkupUsulan,
    })
  } catch (error) {
    console.error('Error fetching lingkup usulan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lingkup usulan' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(context.params)
    const body = await req.json()
    const data = CreateLingkupUsulanSchema.parse(body)

    const lingkupUsulan = await prisma.lingkupUsulan.create({
      data: {
        ...data,
        proposalId: id,
      },
    })

    return NextResponse.json({
      success: true,
      data: lingkupUsulan,
    })
  } catch (error) {
    console.error('Error creating lingkup usulan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create lingkup usulan' },
      { status: 500 }
    )
  }
}
