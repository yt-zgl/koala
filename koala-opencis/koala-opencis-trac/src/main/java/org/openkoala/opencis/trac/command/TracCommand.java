package org.openkoala.opencis.trac.command;

import java.io.IOException;

import org.openkoala.opencis.api.Command;
import org.openkoala.opencis.api.Project;

import com.dayatang.configuration.Configuration;
import com.trilead.ssh2.Connection;
import com.trilead.ssh2.Session;

/**
 * 命令模式之余，此抽象类又是子类的模板，子类只需要实现对应的抽象方法即可
 * @author 赵健华
 * 2013-9-23 下午7:10:32
 */
public abstract class TracCommand implements Command {

	protected Project project = null;
	
	protected String host;
	
	protected String userName;
	
	protected String password;
	
	public TracCommand() {
		// TODO Auto-generated constructor stub
		
	}

	public TracCommand(Configuration configuration,Project project) {
		this.host = configuration.getString("HOST");
		this.userName = configuration.getString("USER");
		this.password = configuration.getString("PASSWORD");
		this.project = project;
		
	}
	
	/**
	 * 模板方法
	 * @throws Exception 
	 */
	@Override
	public final void execute() throws Exception {
		// TODO Auto-generated method stub
		Connection connection = null;
		Session session = null;
		connection = new Connection(host);
		try {
			connection.connect();
			boolean isAuthenticated = connection.authenticateWithPassword(userName, password);
			if (isAuthenticated == false){
				throw new IOException("Authentication failed.");
			}
			session = connection.openSession();
			session.execCommand(getCommand());
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			throw new Exception("无法执行命令：" + getCommand());
		}finally{
			session.close();
			connection.close();
		}
	}
	
	public abstract String getCommand();
}