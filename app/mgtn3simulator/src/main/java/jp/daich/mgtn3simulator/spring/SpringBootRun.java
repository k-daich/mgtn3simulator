package jp.daich.mgtn3simulator.spring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class SpringBootRun {
    
    public static void main(String[] args) {
        SpringApplication.run(SpringBootRun.class, args);
    }

    @RequestMapping(value = "/")
    String hello() {
        return "Hello mgtn3simulator Root!";
    }
}