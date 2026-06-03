import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Building2, Phone, Mail, FileText, CheckCircle2, Clock, MoreVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetClientPipeline, 
  useCreateClient, 
  useUpdateClient,
  getGetClientPipelineQueryKey 
} from "@workspace/api-client-react";
import type { Client } from "@workspace/api-client-react";

const STAGES = ["Lead", "Contacted", "Proposal Sent", "Demo", "In Progress", "Completed", "Paid"];

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  businessType: z.string().min(1, "Business type is required"),
  contactInfo: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  paymentStatus: z.string().min(1, "Payment status is required"),
  projectValue: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export default function CRM() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: pipeline, isLoading } = useGetClientPipeline();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      businessType: "Web Design",
      contactInfo: "",
      status: "Lead",
      paymentStatus: "Unpaid",
      projectValue: 0,
      notes: "",
    },
  });

  const onSubmit = (data: z.infer<typeof clientSchema>) => {
    createClient.mutate({ data }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetClientPipelineQueryKey() });
      }
    });
  };

  const handleStatusChange = (client: Client, newStatus: string) => {
    updateClient.mutate({ id: client.id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetClientPipelineQueryKey() });
      }
    });
  };

  // Helper to ensure all stages exist even if empty
  const stagesToRender = STAGES.map(stageName => {
    const pipelineStage = pipeline?.stages.find(s => s.stage === stageName);
    return {
      stage: stageName,
      clients: pipelineStage?.clients || [],
      value: pipelineStage?.value || 0,
      count: pipelineStage?.count || 0
    };
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Pipeline</h1>
            <p className="text-muted-foreground flex items-center gap-4">
              <span>Total Pipeline Value: <strong className="text-foreground">${pipeline?.totalValue?.toLocaleString() || "0"}</strong></span>
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Client / Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="businessType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Web Design">Web Design</SelectItem>
                          <SelectItem value="Printing">Printing</SelectItem>
                          <SelectItem value="Consulting">Consulting</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="projectValue" render={({ field }) => (
                    <FormItem><FormLabel>Project Value ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select payment status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                          <SelectItem value="Partial">Partial</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="contactInfo" render={({ field }) => (
                  <FormItem><FormLabel>Contact Info (Email/Phone)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createClient.isPending}>
                  {createClient.isPending ? "Adding..." : "Add Client"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-4 w-max min-w-full">
          {isLoading ? (
            // Skeletons
            STAGES.slice(0, 4).map((_, i) => (
              <div key={i} className="w-[320px] shrink-0 bg-muted/5 rounded-lg border border-border/50 p-4 flex flex-col">
                <div className="h-6 w-32 bg-muted/20 animate-pulse rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-32 bg-muted/20 animate-pulse rounded border border-border/50" />
                  <div className="h-32 bg-muted/20 animate-pulse rounded border border-border/50" />
                </div>
              </div>
            ))
          ) : (
            stagesToRender.map((stage) => (
              <div key={stage.stage} className="w-[320px] shrink-0 flex flex-col bg-[#0a0a0c] rounded-xl border border-border/40 max-h-full">
                <div className="p-3 border-b border-border/40 flex items-center justify-between bg-card/50 rounded-t-xl shrink-0">
                  <div className="font-semibold text-sm tracking-tight flex items-center gap-2">
                    {stage.stage}
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-background">{stage.count}</Badge>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">${stage.value.toLocaleString()}</span>
                </div>
                
                <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                  {stage.clients.map((client) => (
                    <Card key={client.id} className="bg-card hover:bg-card/80 border-border/60 transition-colors shadow-sm cursor-default">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-sm line-clamp-1">{client.name}</div>
                          <Select 
                            value={client.status} 
                            onValueChange={(val) => handleStatusChange(client, val)}
                          >
                            <SelectTrigger className="h-6 w-[20px] p-0 border-0 bg-transparent shadow-none hover:bg-white/5 focus:ring-0">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </SelectTrigger>
                            <SelectContent align="end">
                              {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <Building2 className="h-3 w-3" />
                          <span className="line-clamp-1">{client.businessType}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 font-mono ${
                              client.paymentStatus === 'Paid' ? 'text-green-500 border-green-500/30 bg-green-500/10' :
                              client.paymentStatus === 'Partial' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' :
                              'text-destructive border-destructive/30 bg-destructive/10'
                            }`}
                          >
                            {client.paymentStatus}
                          </Badge>
                          <span className="text-xs font-bold font-mono">
                            ${client.projectValue?.toLocaleString() || "0"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stage.clients.length === 0 && (
                    <div className="h-24 rounded-lg border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
