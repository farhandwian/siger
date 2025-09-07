import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { UpdateActivityProposalSchema } from '@/lib/schemas/proposal'

const ParamsSchema = z.object({
  id: z.string(),
})

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(context.params)

    const proposal = await prisma.activityProposal.findUnique({
      where: { id },
      include: {
        lingkupUsulan: true,
        readinessCriteria: true,
      },
    })

    if (!proposal) {
      return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: proposal,
    })
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch proposal' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(context.params)
    const body = await req.json()
    const data = UpdateActivityProposalSchema.parse(body)

    const proposal = await prisma.activityProposal.update({
      where: { id },
      data,
      include: {
        lingkupUsulan: true,
        readinessCriteria: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: proposal,
    })
  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update proposal' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(context.params)

    await prisma.activityProposal.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Proposal deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete proposal' },
      { status: 500 }
    )
  }
}
