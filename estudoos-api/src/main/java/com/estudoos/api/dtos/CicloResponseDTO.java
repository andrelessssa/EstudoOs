package com.estudoos.api.dtos;

import java.util.Collections;
import java.util.List;

public class CicloResponseDTO {

    private int totalDias;
    private int totalBlocos;
    private List<DiaDTO> dias;
    private String aviso;

    public CicloResponseDTO() {}

    public CicloResponseDTO(int totalDias, int totalBlocos, List<DiaDTO> dias, String aviso) {
        this.totalDias = totalDias;
        this.totalBlocos = totalBlocos;
        this.dias = dias;
        this.aviso = aviso;
    }

    public static CicloResponseDTO vazio(String aviso) {
        return new CicloResponseDTO(0, 0, Collections.emptyList(), aviso);
    }

    public int getTotalDias() { return totalDias; }
    public void setTotalDias(int totalDias) { this.totalDias = totalDias; }

    public int getTotalBlocos() { return totalBlocos; }
    public void setTotalBlocos(int totalBlocos) { this.totalBlocos = totalBlocos; }

    public List<DiaDTO> getDias() { return dias; }
    public void setDias(List<DiaDTO> dias) { this.dias = dias; }

    public String getAviso() { return aviso; }
    public void setAviso(String aviso) { this.aviso = aviso; }

    public static class DiaDTO {
        private String data;
        private List<BlocoDTO> blocos;

        public DiaDTO() {}

        public DiaDTO(String data, List<BlocoDTO> blocos) {
            this.data = data;
            this.blocos = blocos;
        }

        public String getData() { return data; }
        public void setData(String data) { this.data = data; }

        public List<BlocoDTO> getBlocos() { return blocos; }
        public void setBlocos(List<BlocoDTO> blocos) { this.blocos = blocos; }
    }

    public static class BlocoDTO {
        private String id;
        private String matId;
        private String materia;
        private String topicId;
        private String assunto;
        private String dica;
        private boolean concluido;

        public BlocoDTO() {}

        public BlocoDTO(String id, String matId, String materia, String topicId, String assunto, String dica, boolean concluido) {
            this.id = id;
            this.matId = matId;
            this.materia = materia;
            this.topicId = topicId;
            this.assunto = assunto;
            this.dica = dica;
            this.concluido = concluido;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getMatId() { return matId; }
        public void setMatId(String matId) { this.matId = matId; }

        public String getMateria() { return materia; }
        public void setMateria(String materia) { this.materia = materia; }

        public String getTopicId() { return topicId; }
        public void setTopicId(String topicId) { this.topicId = topicId; }

        public String getAssunto() { return assunto; }
        public void setAssunto(String assunto) { this.assunto = assunto; }

        public String getDica() { return dica; }
        public void setDica(String dica) { this.dica = dica; }

        public boolean isConcluido() { return concluido; }
        public void setConcluido(boolean concluido) { this.concluido = concluido; }
    }
}