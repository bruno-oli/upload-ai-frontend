import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { api } from '@/lib/axios'

type Prompt = {
  id: string
  title: string
  template: string
}

interface PromptSelectProps {
  onPromptSelect: (template: string) => void
}

const PromptSelect = ({ onPromptSelect }: PromptSelectProps) => {
  const [prompts, setPrompts] = useState<Prompt[] | null>(null)

  useEffect(() => {
    api.get('/prompts').then((response) => {
      setPrompts(response.data.prompts)
    })
  }, [])

  function handlePromptSelected(promptId: string) {
    const selectedPrompt = prompts?.find((prompt) => prompt.id === promptId)

    if (selectedPrompt) {
      onPromptSelect(selectedPrompt.template)
    }
  }

  return (
    <Select onValueChange={handlePromptSelected}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um prompt..." />
      </SelectTrigger>
      <SelectContent>
        {prompts?.map((prompt) => (
          <SelectItem value={prompt.id} key={prompt.id}>
            {prompt.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default PromptSelect
