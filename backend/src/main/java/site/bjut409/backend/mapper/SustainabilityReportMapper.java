package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import site.bjut409.backend.model.SustainabilityReportRecord;

import java.util.List;

@Mapper
public interface SustainabilityReportMapper {

    @Insert("""
            insert into sustainability_reports(summary, report_data, generated_by, range_start, range_end)
            values(#{summary}, cast(#{reportData} as jsonb), #{generatedBy}, #{rangeStart}, #{rangeEnd})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "reportId", keyColumn = "report_id")
    int insert(SustainabilityReportRecord report);

    @Select("""
            select report_id, summary, report_data::text as report_data, generated_by, range_start, range_end, generated_at
            from sustainability_reports
            where report_id = #{reportId}
            """)
    SustainabilityReportRecord findById(Long reportId);

    @Select("""
            select report_id, summary, report_data::text as report_data, generated_by, range_start, range_end, generated_at
            from sustainability_reports
            order by generated_at desc, report_id desc
            """)
    List<SustainabilityReportRecord> findAll();
}
