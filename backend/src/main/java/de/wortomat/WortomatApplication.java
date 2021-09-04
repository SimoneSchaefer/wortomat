package de.wortomat;

import de.wortomat.service.StorageConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.sql.DataSource;
import java.io.File;
import java.io.IOException;

@SpringBootApplication
public class WortomatApplication {
	@Autowired
	Environment env;

	@Autowired
	StorageConfigService fileService;

	public static void main(String[] args) {
		SpringApplication.run(WortomatApplication.class, args);
	}

	@Bean
	public DataSource dataSource() throws IOException {
		File directory = new File(fileService.getStorageLocation());
		if (! directory.exists()){
			directory.mkdir();
		}
		final DriverManagerDataSource dataSource = new DriverManagerDataSource();
		dataSource.setDriverClassName(env.getProperty("driverClassName"));
		dataSource.setUrl(env.getProperty("url"));
		return dataSource;
	}

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/**");//.allowedOrigins("http://localhost:8080");
			}
		};
	}
}
