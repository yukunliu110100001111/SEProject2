package site.bjut409.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import site.bjut409.backend.model.UserRecord;

@Mapper
public interface UserMapper {

    @Select("select user_id, username, password_hash, role from users where username = #{username}")
    UserRecord findByUsername(String username);

    @Select("select user_id, username, password_hash, role from users where user_id = #{userId}")
    UserRecord findById(Long userId);

    @Insert("insert into users(username, password_hash, role) values(#{username}, #{passwordHash}, #{role})")
    @Options(useGeneratedKeys = true, keyProperty = "userId", keyColumn = "user_id")
    int insert(UserRecord user);

    @Update("update users set username = #{username} where user_id = #{userId}")
    int updateUsername(UserRecord user);

    @Update("update users set password_hash = #{passwordHash} where user_id = #{userId}")
    int updatePasswordHash(UserRecord user);

    @Select("select count(*) from users")
    long countAll();
}
