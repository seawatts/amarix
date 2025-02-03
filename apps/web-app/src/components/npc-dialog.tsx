'use client'

import { Button } from '@acme/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@acme/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@acme/ui/drawer'
import { useIsMobile } from '@acme/ui/hooks/use-mobile'
import { Text } from '@acme/ui/typography'

interface NPCDialogProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

export function NPCDialog({ isOpen, onClose, message }: NPCDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>NPC Interaction</DrawerTitle>
            <Text>{message}</Text>
          </DrawerHeader>
          <div className="p-4">
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>NPC Interaction</DialogTitle>
          <DialogDescription asChild>
            <Text>{message}</Text>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
