package jp.daich.mgtn3simulator.spring.controller;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jp.daich.mgtn3simulator.spring.entity.IndexDto;
import jp.daich.mgtn3simulator.spring.model.procedure.IndexInitProcedure;

@Controller
@ResponseBody
public class IndexController {

    @Autowired
    IndexInitProcedure indexInitProcedure;

    private Logger logger = LogManager.getLogger();

    @RequestMapping(path = "/app/mgtn3simulator/getSituation", method = RequestMethod.GET)
    public ResponseEntity<IndexDto> init(@RequestParam("situationId") String situationId) {

        logger.info("[IndexController-execute] : start");

        return ResponseEntity.ok(
                // LetterInfoの生成
                indexInitProcedure.execute(situationId));
    }

}