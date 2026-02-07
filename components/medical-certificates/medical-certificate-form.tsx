"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/consultations/back-button";
import { Loader2, Download, Award } from "lucide-react";
import { toast } from "sonner";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  CertificateType,
  CertificateData,
  ComparecimentoCertificateData,
  AptidaoCertificateData,
  AfastamentoCertificateData,
  AcompanhanteCertificateData,
} from "@/lib/types/medical-certificate";
import {
  CERTIFICATE_TYPE_LABELS,
  CERTIFICATE_TYPE_ICONS,
  CERTIFICATE_TYPE_DESCRIPTIONS,
} from "@/lib/types/medical-certificate";

interface MedicalCertificateFormProps {
  patientId: string;
  patientName: string;
  patientDateOfBirth: string;
  responsibleName?: string;
  consultationId?: string;
  consultationDate: string;
  doctorName: string;
  doctorCRM: string;
  doctorSpecialty?: string;
}

export function MedicalCertificateForm({
  patientId,
  patientName,
  patientDateOfBirth,
  responsibleName,
  consultationId,
  consultationDate,
  doctorName,
  doctorCRM,
  doctorSpecialty,
}: MedicalCertificateFormProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<CertificateType | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados dos formulários
  const [comparecimentoData, setComparecimentoData] = useState({
    startTime: "",
    endTime: "",
    observations: "",
  });

  const [aptidaoData, setAptidaoData] = useState({
    activityType: "",
    validUntil: format(addMonths(new Date(), 6), "yyyy-MM-dd"),
    observations: "",
  });

  const [afastamentoData, setAfastamentoData] = useState({
    activityType: "escolares",
    days: 1,
    startDate: format(new Date(consultationDate), "yyyy-MM-dd"),
    cid10: "",
    canLeaveHome: true,
    observations: "",
  });

  const [acompanhanteData, setAcompanhanteData] = useState({
    responsibleName: responsibleName || "",
    startTime: "",
    endTime: "",
    observations: "",
  });

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
    } else {
      router.back();
    }
  };

  const handleGenerate = async () => {
    if (!selectedType) return;

    setLoading(true);
    try {
      let certificateData: CertificateData;
      const baseData = {
        patientName,
        patientDateOfBirth,
        consultationDate,
        doctorName,
        doctorCRM,
        doctorSpecialty,
        city: "São Paulo",
      };

      // Montar dados específicos por tipo
      switch (selectedType) {
        case "comparecimento":
          certificateData = {
            ...baseData,
            startTime: comparecimentoData.startTime || undefined,
            endTime: comparecimentoData.endTime || undefined,
            observations: comparecimentoData.observations || undefined,
          } as ComparecimentoCertificateData;
          break;

        case "aptidao":
          if (!aptidaoData.activityType) {
            toast.error("Preencha o tipo de atividade");
            return;
          }
          certificateData = {
            ...baseData,
            activityType: aptidaoData.activityType,
            validUntil: aptidaoData.validUntil || undefined,
            observations: aptidaoData.observations || undefined,
          } as AptidaoCertificateData;
          break;

        case "afastamento":
          certificateData = {
            ...baseData,
            activityType: afastamentoData.activityType,
            days: afastamentoData.days,
            startDate: afastamentoData.startDate,
            cid10: afastamentoData.cid10 || undefined,
            canLeaveHome: afastamentoData.canLeaveHome,
            observations: afastamentoData.observations || undefined,
          } as AfastamentoCertificateData;
          break;

        case "acompanhante":
          if (!acompanhanteData.responsibleName) {
            toast.error("Preencha o nome do acompanhante");
            return;
          }
          certificateData = {
            ...baseData,
            responsibleName: acompanhanteData.responsibleName,
            startTime: acompanhanteData.startTime || undefined,
            endTime: acompanhanteData.endTime || undefined,
            observations: acompanhanteData.observations || undefined,
          } as AcompanhanteCertificateData;
          break;

        default:
          throw new Error("Tipo de atestado inválido");
      }

      // Gerar PDF via API standalone
      const response = await fetch("/api/medical-certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          consultationId: consultationId || null,
          certificateType: selectedType,
          certificateData,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar atestado");
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Atestado_${selectedType}_${patientName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Atestado gerado com sucesso!");
      
      // Redirecionar de volta para seleção de pacientes
      router.push("/medical-certificates/new");
    } catch (error: any) {
      console.error("Erro ao gerar atestado:", error);
      toast.error("Erro ao gerar atestado: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton onClick={handleBack} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedType ? CERTIFICATE_TYPE_LABELS[selectedType] : "Gerar Atestado"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {selectedType
                    ? "Preencha os dados do atestado"
                    : "Escolha o tipo de atestado que deseja gerar"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Informações do Paciente */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Paciente: <span className="font-semibold">{patientName}</span>
              </p>
              <p className="text-sm text-gray-700">
                Data de Nascimento:{" "}
                {format(new Date(patientDateOfBirth), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
              {consultationId && (
                <p className="text-sm text-gray-700">
                  Vinculado à consulta de{" "}
                  {format(new Date(consultationDate), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seleção de Tipo ou Formulário */}
        {!selectedType ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selecione o Tipo de Atestado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(CERTIFICATE_TYPE_LABELS) as CertificateType[]).map((type) => (
                <Card
                  key={type}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedType(type)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">{CERTIFICATE_TYPE_ICONS[type]}</span>
                      {CERTIFICATE_TYPE_LABELS[type]}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {CERTIFICATE_TYPE_DESCRIPTIONS[type]}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{CERTIFICATE_TYPE_ICONS[selectedType]}</span>
                {CERTIFICATE_TYPE_LABELS[selectedType]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário específico por tipo */}
              {selectedType === "comparecimento" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Horário de Início</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={comparecimentoData.startTime}
                        onChange={(e) =>
                          setComparecimentoData({
                            ...comparecimentoData,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">Horário de Término</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={comparecimentoData.endTime}
                        onChange={(e) =>
                          setComparecimentoData({
                            ...comparecimentoData,
                            endTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="observations">Observações (Opcional)</Label>
                    <Textarea
                      id="observations"
                      rows={3}
                      value={comparecimentoData.observations}
                      onChange={(e) =>
                        setComparecimentoData({
                          ...comparecimentoData,
                          observations: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {selectedType === "aptidao" && (
                <>
                  <div>
                    <Label htmlFor="activityType">
                      Tipo de Atividade <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="activityType"
                      placeholder="Ex: atividades escolares, prática de natação"
                      value={aptidaoData.activityType}
                      onChange={(e) =>
                        setAptidaoData({
                          ...aptidaoData,
                          activityType: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Validade</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={aptidaoData.validUntil}
                      onChange={(e) =>
                        setAptidaoData({
                          ...aptidaoData,
                          validUntil: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="observations">Observações (Opcional)</Label>
                    <Textarea
                      id="observations"
                      rows={3}
                      value={aptidaoData.observations}
                      onChange={(e) =>
                        setAptidaoData({
                          ...aptidaoData,
                          observations: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {selectedType === "afastamento" && (
                <>
                  <div>
                    <Label htmlFor="activityType">Tipo de Atividade</Label>
                    <Select
                      value={afastamentoData.activityType}
                      onValueChange={(value) =>
                        setAfastamentoData({
                          ...afastamentoData,
                          activityType: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="escolares">Escolares</SelectItem>
                        <SelectItem value="esportivas">Esportivas</SelectItem>
                        <SelectItem value="outras">Outras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="days">Dias de Afastamento</Label>
                      <Input
                        id="days"
                        type="number"
                        min="1"
                        value={afastamentoData.days}
                        onChange={(e) =>
                          setAfastamentoData({
                            ...afastamentoData,
                            days: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="startDate">Data de Início</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={afastamentoData.startDate}
                        onChange={(e) =>
                          setAfastamentoData({
                            ...afastamentoData,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cid10">CID-10 (Opcional)</Label>
                    <Input
                      id="cid10"
                      placeholder="Ex: J00"
                      value={afastamentoData.cid10}
                      onChange={(e) =>
                        setAfastamentoData({
                          ...afastamentoData,
                          cid10: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canLeaveHome"
                      checked={afastamentoData.canLeaveHome}
                      onCheckedChange={(checked) =>
                        setAfastamentoData({
                          ...afastamentoData,
                          canLeaveHome: !!checked,
                        })
                      }
                    />
                    <Label htmlFor="canLeaveHome" className="cursor-pointer">
                      Pode sair de casa
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="observations">Observações (Opcional)</Label>
                    <Textarea
                      id="observations"
                      rows={3}
                      value={afastamentoData.observations}
                      onChange={(e) =>
                        setAfastamentoData({
                          ...afastamentoData,
                          observations: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {selectedType === "acompanhante" && (
                <>
                  <div>
                    <Label htmlFor="responsibleName">
                      Nome do Acompanhante <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="responsibleName"
                      value={acompanhanteData.responsibleName}
                      onChange={(e) =>
                        setAcompanhanteData({
                          ...acompanhanteData,
                          responsibleName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Horário de Início</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={acompanhanteData.startTime}
                        onChange={(e) =>
                          setAcompanhanteData({
                            ...acompanhanteData,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">Horário de Término</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={acompanhanteData.endTime}
                        onChange={(e) =>
                          setAcompanhanteData({
                            ...acompanhanteData,
                            endTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="observations">Observações (Opcional)</Label>
                    <Textarea
                      id="observations"
                      rows={3}
                      value={acompanhanteData.observations}
                      onChange={(e) =>
                        setAcompanhanteData({
                          ...acompanhanteData,
                          observations: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Voltar
                </Button>
                <Button onClick={handleGenerate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
