package jp.daich.mgtn3simulator.spring.entity;

import java.io.Serializable;

public class IndexDto implements Serializable {

    /** serialVersionUID */
    private static final long serialVersionUID = -3832958844415973608L;

    public IndexDto(String situationId) {
        this.setSituationId(situationId);
    }

    private String situationId;
    private EnemyDto enemyDto;

    public EnemyDto getEnemyDto() {
        return enemyDto;
    }

    public void setEnemyDto(EnemyDto enemyDto) {
        this.enemyDto = enemyDto;
    }

    public String getSituationId() {
        return situationId;
    }

    public void setSituationId(String situationId) {
        this.situationId = situationId;
    }

}