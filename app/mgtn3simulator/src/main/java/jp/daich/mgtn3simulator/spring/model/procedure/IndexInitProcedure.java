package jp.daich.mgtn3simulator.spring.model.procedure;

import org.springframework.stereotype.Component;

import jp.daich.mgtn3simulator.spring.entity.IndexDto;

@Component
public class IndexInitProcedure {
    
    public IndexDto execute(String situationId){
        return new IndexDto(situationId);
    }
}