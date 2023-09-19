import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { api } from "@/lib/axios";

type Prompt = {
  id: string,
  title: string,
  template: string
};

interface PromptSelectProps {
  onPromptSelected: (template: string) => void
}

export function PromptSelect(props: PromptSelectProps) {
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);

  useEffect( () => {
    api.get('/prompts').then( response => {
      setPrompts(response.data);
    });
  });

  function handlePromptSelected(promptId: string) {
    const promptSelected = prompts?.find( prompt => prompt.id === promptId );

    if (!promptSelected) {
      return;
    }

    props.onPromptSelected(promptSelected.template);
  }

  return (
    <Select onValueChange={handlePromptSelected}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um prompt..." />
      </SelectTrigger>

      <SelectContent>
        {
          prompts?.map( prompt => 
            <SelectItem value={prompt.id} key={prompt.id}>
              {prompt.title}
            </SelectItem>
          )
        }
      </SelectContent>
    </Select>
  );
}
